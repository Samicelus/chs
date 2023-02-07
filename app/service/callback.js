'use strict';

// app/service/user.js
const _ = require('lodash');
const Service = require('egg').Service;
const { SIGNPOSITION_MAP } = require('../../const/module/consult');
const xml2js = require('xml2js-force-cdata');
const parser = new xml2js.Parser({
    explicitArray: false
});

class CallbackService extends Service {
    async getCallbackResult({app_id, callbackTag, method, body={}, query={}, headers, requestIp, callbackLog={}}) {
        const {ctx: { model, helper, logger }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let callRes;
        let result;
        let status;
        callbackLog.process = [];
        callbackLog.callResult={
        };
        let t0, t1, tt;
        t0 = new Date().getTime();
        try{
            t1 = new Date().getTime();
            let getConfigLog = {
                state: "getConfig"
            }
            callbackLog.process.push(getConfigLog);

            let callbackConfig = await model.CallbackConfig.findOne({
                callbackTag,
                app_oid: ObjectId(app_id)
            }).lean();
            tt = new Date().getTime();
            getConfigLog.time = tt-t1;
            if (!callbackConfig) {
                throw new Error(`回调接口应用不存在 callbackTag为 ${callbackTag}，app_id为 ${app_id}`);
            }
            callbackLog.callbackConfig_oid = callbackConfig._id;
            callbackLog.app_oid = ObjectId(app_id);
            callbackLog.requestIp = requestIp;

            let allParamsData = {param: {app_id, callbackTag}, body, query, headers};
            callbackLog.requestBody = JSON.stringify({body: body, query: query, param: {app_id, callbackTag}},null,2);
            callbackLog.requestHeader = JSON.stringify(headers,null,2);

            let nowMethodCallbackConfig = this.getConfigByMethod(callbackConfig, method);
            if (nowMethodCallbackConfig) {
                // 解析body格式
                if (nowMethodCallbackConfig.bodyType === 'text' && typeof body === 'string' && nowMethodCallbackConfig.convertText) {
                    t1 = new Date().getTime();
                    let parseDataLog = {
                        state: "parseData"
                    }
                    callbackLog.process.push(parseDataLog);
                    switch(nowMethodCallbackConfig.convertText){
                        case 'xml':
                            body = await parser.parseStringPromise(body);
                            body = body.xml;
                            break;
                        case 'json':
                            body = JsonParseRecursive(body);
                            break;
                        default:
                            break;
                    }
                    tt = new Date().getTime();
                    parseDataLog.time = tt-t1;
                }

                // 校验签名
                if (nowMethodCallbackConfig.verifySignature && nowMethodCallbackConfig.verifySignature.enable) {
                    t1 = new Date().getTime();
                    let signLog = {
                        state: "sign"
                    }
                    callbackLog.process.push(signLog);
                    // 原始签名
                    let origin_signature = allParamsData[nowMethodCallbackConfig.verifySignature.signature.origin][nowMethodCallbackConfig.verifySignature.signature.path];
                    // 1. 组合参数
                    let signData = await this.getDataBySignPosition(nowMethodCallbackConfig.verifySignature.verifykeys, {param: {app_id, callbackTag}, body, query, headers})
                    // 2. 排序
                    let sorted = helper.sortByAscii(signData, nowMethodCallbackConfig.verifySignature.signNull, nowMethodCallbackConfig.verifySignature.sortType)
                    //Object.values(signData).filter(item => item).sort().join('');
                    let pairs = [];
                    for(let sortedKey in sorted){
                        if(nowMethodCallbackConfig.verifySignature.sortType == "valuesort"){
                            pairs.push(sorted[sortedKey]);
                        }else{
                            pairs.push(`${sortedKey}=${sorted[sortedKey]}`);
                        }
                    }
                    //分隔符
                    let signDataStr = pairs.join(nowMethodCallbackConfig.verifySignature.enableSeparator?nowMethodCallbackConfig.verifySignature.separator:"");

                    //头部加盐
                    if(nowMethodCallbackConfig.verifySignature.preSalt){
                        signDataStr = nowMethodCallbackConfig.verifySignature.preSalt + signDataStr;
                    }
                    //尾部加盐
                    if(nowMethodCallbackConfig.verifySignature.salt){
                        signDataStr += nowMethodCallbackConfig.verifySignature.salt;
                    }

                    // 3. 生成签名
                    let now_signature;
                    let signSecret, customConfig;
                    if(nowMethodCallbackConfig.verifySignature.secret){
                        const customizeConfig = await model.ConsultCustomizeConfig.findOne({
                            app_oid: ObjectId(app_id)
                        }).lean();
                        if(customizeConfig && customizeConfig.config){
                            customConfig = customizeConfig.config;
                        }
                        let signSecretConfig = _.get(customConfig, nowMethodCallbackConfig.verifySignature.secret);
                        signSecret = signSecretConfig?(signSecretConfig.value||signSecretConfig.default):''
                    }
                    switch (nowMethodCallbackConfig.verifySignature.algorithm) {
                        case 'md5': now_signature = helper.md5(signDataStr, nowMethodCallbackConfig.verifySignature.coding); break;
                        case 'sha1': now_signature = helper.sha1(signDataStr, nowMethodCallbackConfig.verifySignature.coding); break;
                        case 'sha256': now_signature = helper.sha256(signDataStr, nowMethodCallbackConfig.verifySignature.coding); break;
                        case 'hmac': now_signature = helper.hmac(signDataStr, nowMethodCallbackConfig.verifySignature.coding, signSecret); break;
                        case 'sm3': now_signature = helper.sm3(signDataStr); break;
                        // case 'RSA-SHA1': now_signature = helper.rsa(signDataStr, nowMethodCallbackConfig.verifySignature.coding, signSecret); break;
                        // case 'RSA-SHA256': now_signature = helper.rsa2(signDataStr, nowMethodCallbackConfig.verifySignature.coding, signSecret); break;
                        default: now_signature=''; break;
                    }
                    tt = new Date().getTime();
                    signLog.time = tt-t1;
                    // 4. 校验
                    if (["md5", "sha1", "sha256", "hmac", "sm3"].includes(nowMethodCallbackConfig.verifySignature.algorithm) && now_signature !== origin_signature) {
                        throw new Error(`参数签名错误:${signDataStr}`);
                    }
                    if(["RSA-SHA1", "RSA-SHA256"].includes(nowMethodCallbackConfig.verifySignature.algorithm)){
                        if(!helper.decrypt(origin_signature, nowMethodCallbackConfig.verifySignature.algorithm, signSecret, nowMethodCallbackConfig.verifySignature.coding, signDataStr)){
                            throw new Error(`参数签名错误:${signDataStr}`);
                        }
                    }
                }
            }

            if(callbackConfig.mock && callbackConfig.mock.enable){
                //使用mock返回
                t1 = new Date().getTime();
                let mockLog = {
                    state: "mock"
                }
                callbackLog.process.push(mockLog);
                result = callbackConfig.mock.mockReturn;
                tt = new Date().getTime();
                mockLog.time = tt-t1;
            }else{
                // 判断是否有 asReturn
                if (nowMethodCallbackConfig && nowMethodCallbackConfig.asReturn) {
                    t1 = new Date().getTime();
                    let invokeCallbackLog = {
                        state: "invokeCallback"
                    }
                    callbackLog.process.push(invokeCallbackLog);

                    // 有就先调用
                    result = await this.ctx.service.api.callConfigedApi({
                        api_id: nowMethodCallbackConfig.asReturn,
                        params: allParamsData
                    });
                    if (nowMethodCallbackConfig.keyAsReturn) {
                        result = _.get(result, nowMethodCallbackConfig.returnKeyPath);
                    }

                    tt = new Date().getTime();
                    invokeCallbackLog.time = tt-t1;
                }

                // 调用callbackUrl
                if (callbackConfig.callbackUrl) {
                    //走回调接口时，返回hospitalId
                    let appConfig = await model.AppConfig.findOne({_id:ObjectId(app_id)}).lean();
                    let hospitalId = appConfig.company?appConfig.company.hospitalId:"";
                    //实际走回调接口
                    t1 = new Date().getTime();
                    let invokeCallbackLog = {
                        state: "invokeCallback"
                    }
                    callbackLog.process.push(invokeCallbackLog);
                    headers.host = "";
                    callRes = (await this.ctx.curl(callbackConfig.callbackUrl,
                      {
                          method: 'POST',
                          contentType:'json',
                          data: _.merge(body, query),
                          headers,
                          dataType: 'json'
                      }
                    ));
                    if (!result) {
                        // 如果result还未赋值，则用 调用callbackUrl 的结果
                        result = callRes.data;
                        if(typeof(result) == "object"){
                            result.hospitalId = hospitalId;
                        }
                    }

                    status = callRes.status;
                    tt = new Date().getTime();
                    invokeCallbackLog.time = tt-t1;
                }

                t1 = new Date().getTime();
                let invokeMultiCallbackLog = {
                    state: "invokeMultiCallback"
                }
                callbackLog.process.push(invokeMultiCallbackLog);
                // 同步调用 调用接口
                if(nowMethodCallbackConfig){
                    nowMethodCallbackConfig.callApis.forEach(function(apiId) {
                        if (apiId.toString() === nowMethodCallbackConfig.asReturn.toString()) {
                            // 已经调用过了，直接跳过
                            return ;
                        }
                        this.ctx.service.api.callConfigedApi({
                            api_id: apiId,
                            params: {param: {app_id, callbackTag}, body, query, headers}
                        });
                    }.bind(this));
                }

                tt = new Date().getTime();
                invokeMultiCallbackLog.time = tt-t1;
            }

            if(typeof(result) == "object"){
                callbackLog.result = JSON.stringify(result);
            }else{
                callbackLog.result = result;
            }
            callbackLog.callResult.status = status
            callbackLog.callResult.success = true;

            tt = new Date().getTime();
            callbackLog.totalTime = tt-t0;

        }catch(e){
            callbackLog.callResult.error = e.stack;
            callbackLog.callResult.success = false;
            callbackLog.process.push({
                state: "error"
            });
            tt = new Date().getTime();
            callbackLog.totalTime = tt-t0;
            logger.error(e.stack);
        }

        //记录回调日志
        let log = await model.CallbackLog(callbackLog).save();

        return result? result : {};
    }

    // 根据signPosition取参数
    async getDataBySignPosition(params, originData) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let result = {};
        // 先从数据库里读取公共参数的配置
        let consultCustomizeConfigData = await model.ConsultCustomizeConfig.findOne({
            app_oid: ObjectId(originData.param.app_id)
        }).lean();
        for (let i=0, len=params.length; i<len; i++) {
            // 公用参数
            if (SIGNPOSITION_MAP[params[i].origin] === SIGNPOSITION_MAP.customConfig) {
                if (!consultCustomizeConfigData || !consultCustomizeConfigData.config || !consultCustomizeConfigData.config[params[i].path]){
                    continue;
                }
                result[params[i].path] = consultCustomizeConfigData.config[params[i].path].default;
                continue;
            }
            // 从header/body/query/param中获取的参数
            result[params[i].path] = originData[params[i].origin][params[i].path];
        }
        return result;
    }

    // 根据method获取配置
    getConfigByMethod(config, method) {
        for (let i=0, len=config.methodConfigs.length; i<len; i++) {
            if (method.toLowerCase() === config.methodConfigs[i].method.toLowerCase()) {
                return config.methodConfigs[i];
            }
        }
        return null;
    }
}

function JsonParseRecursive(str){
    if(typeof str == 'string'){
        return JsonParseRecursive(JSON.parse(str));
    }else{
        return str;
    }
}

module.exports = CallbackService;
