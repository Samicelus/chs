'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;
const soap = require('soap');
const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js-force-cdata');
const parser = new xml2js.Parser({
    explicitArray: false
});
const Parameter = require('parameter');
const parameter = new Parameter();
const qs = require('qs');
const FormData = require('form-data');

class ApiService extends Service {
    /**
     * 请求外部api并返回:
     *
     * 获取api配置 --> 判断是否有已缓存结果 --是--> 获取缓存结果 --> 按需求解析返回并输出结果
     *                         |                                    ^
     *                         否                                   |
     *                         v                                    |
     *                  是否有前置请求 --否--> 请求远程api --> 是否缓存结果 --是--> 缓存入redis
     *                         |                    ^
     *                         是                   |
     *                         v                    |
     *                  完成前置请求 --> 用前置请求结果包装本次请求
     *
     * @param {String}      app_id  在线问诊应用id
     * @param {String}      apiName api名称
     * @param {Object}      params api中用来从数据库获取数据所用的 consult_id, consultAdvice_id, consultRecord_id, consultMessage_id
     */
    async callConfigedApi ({app_id, apiName, api_id, company_id, hospitalId, tagName, type, params={}, apiLog={}}){
        const {ctx: { model, helper, validate }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;
        let returned;
        let tempPaths = [];
        let isRequest = false;//是否完成整个请求
        if(app_id){
            apiLog.app_oid = ObjectId(app_id);
        }
        apiLog.process = [];
        apiLog.callResult={
        };
        let t0, t1, tt;
        t0 = new Date().getTime();
        let apiObj;
        let callError;
        try{

            apiLog.params = JSON.stringify(params);
            t1 = new Date().getTime();
            let getConfigLog = {
                state: "getConfig"
            }
            apiLog.process.push(getConfigLog);

            if(app_id && apiName){
                apiObj = await model.ApiConfig.findOne({
                    name: apiName,
                    app_oid: ObjectId(app_id)
                }).lean();
            }else if((company_id || hospitalId) && tagName){
                let tag = await model.Tag.findOne({tagName}).lean();
                if(!tag){
                    throw new Error(`不存在对应的tagName:${tagName}`);
                }
                let appCondition = {};
                if(company_id){
                    appCondition = {
                        company_oid: ObjectId(company_id)
                    }
                }
                if(hospitalId){
                    appCondition = {
                        "company.hospitalId": hospitalId
                    }
                }
                let app_oids = await model.AppConfig.distinct('_id', appCondition);
                let apiCondition = {
                    app_oid: {"$in":app_oids},
                    tag_oid: tag._id
                }
                if(type){
                    apiCondition.type = type;
                }
                apiObj = await model.ApiConfig.findOne(apiCondition).lean();
                if(!apiObj){
                    throw new Error(`目标接口应用不存在 tagName为 ${tagName} 的接口配置`);
                }
                apiLog.app_oid = apiObj.app_oid;
            } else if (api_id) {
                apiObj = await model.ApiConfig.findOne({_id: ObjectId(api_id)}).lean();
                apiLog.app_oid = apiObj.app_oid;
            }


            if(!apiObj){
                let errMsg = `app:${app_id}中未找到配置的api:${apiName}`;
                throw new Error(`app:${app_id}中未找到配置的api:${apiName}`);
            }
            app_id = apiObj.app_oid;
            apiLog.api_oid = apiObj._id;
            apiLog.versionTag = apiObj.versionTag;
            apiLog.tag_oid = apiObj.tag_oid;
            apiLog.apiGroup_oid = apiObj.apiGroup_oid;
            apiLog.apiTemplate_oid = apiObj.apiTemplate_oid;

            //向ctx中添加本次执行上下文数据
            this.ctx.apiExecutionContext = {
                api_oid: apiObj._id,
                apiName: apiObj.name
            }

            //用以存结果
            let result;
            let preResult;
            let customConfig = {};

            if(apiObj.mockReturn){
                return this.ctx.service.groupTag.tag.getTestReturn(
                    {
                        api_id: apiObj._id
                    }
                )
            }

            //回调映射
            let callbackTagMap = {};
            const thisAppCallbacks = await model.CallbackConfig.find({app_oid:apiObj.app_oid}).lean();
            let baseUrl = this.config.baseUrl;
            for(let callbackConfig of thisAppCallbacks){
                callbackTagMap[callbackConfig.callbackTag] = `${baseUrl}${callbackConfig.callbackTag}/${callbackConfig.app_oid}/callback`;
            }

            const customizeConfig = await model.ConsultCustomizeConfig.findOne({
                app_oid: ObjectId(app_id)
            }).lean();

            if(customizeConfig && customizeConfig.config){
                customConfig = customizeConfig.config;
            }

            tt = new Date().getTime();
            getConfigLog.time = tt-t1;

            //如果有缓存,则从缓存中取
            if(apiObj.cache && apiObj.cache.isCached){

                apiLog.resultFromCache = true;

                t1 = new Date().getTime();
                let fromCacheLog = {
                    state: "fromCache"
                }
                apiLog.process.push(fromCacheLog);

                let key = `consult:${app_id}:${apiObj.cache.cacheKey}`;

                apiLog.cacheKey = key;

                //logger.info(`${apiName} got from cached: ${key}`);
                let cached = await redis.get(key);
                if(cached){
                    try {
                        result = JSON.parse(cached);
                    }catch(e){
                        result = cached;
                    }
                }

                tt = new Date().getTime();
                fromCacheLog.time = tt-t1;
            }
            let url, data, query = {};
            //没有缓存结果或缓存已过期
            if(!result){

                t1 = new Date().getTime();
                let parseDataLog = {
                    state: "parseData"
                }
                apiLog.process.push(parseDataLog);

                let hostRoute = [];
                if(apiObj.host){
                    hostRoute.push(apiObj.host);
                }
                if(apiObj.url){
                    hostRoute.push(apiObj.url);
                }

                url = (apiObj.protocal||"") + hostRoute.join('/');

                data = {
                    ...apiObj.data
                };
                data = translateData(params, data);

                tt = new Date().getTime();
                parseDataLog.time = tt-t1;


                t1 = new Date().getTime();
                let formHeaderLog = {
                    state: "formHeader"
                }
                apiLog.process.push(formHeaderLog);

                let method = apiObj.method;
                let headers = {
                    "Content-Type": "application/json"
                };
                if(apiObj.headers){
                    headers = _.merge(
                        headers,
                        apiObj.headers
                    )
                }

                tt = new Date().getTime();
                formHeaderLog.time = tt-t1;

                //如果有前置请求
                if(apiObj.pre && apiObj.pre.hasPre){

                    t1 = new Date().getTime();
                    let callPreApiLog = {
                        state: "callPreApi"
                    }
                    apiLog.process.push(callPreApiLog);

                    preResult = await this.ctx.service.api.callConfigedApi({
                        app_id: apiObj.app_oid,
                        apiName: apiObj.pre.apiName,
                        params
                    });
                    //将preApi的结果按照processReturn的设置写入本次请求的相应部分
                    for(let key in apiObj.pre.processReturn){
                        const thisProcess = apiObj.pre.processReturn[key];
                        if(preResult[key]){
                            //针对该字段的处理写入请求的header
                            if(thisProcess.header){
                                if(!headers){
                                    headers = {};
                                }
                                headers[thisProcess.header.name] = preResult[key];
                            }
                            //针对该字段的处理写入请求的body
                            if(thisProcess.body){
                                if(["POST","PUT","DELETE","PATCH"].includes(method)){
                                    let source = _.set(
                                        {},
                                        thisProcess.body.name,
                                        preResult[key]
                                    );
                                    data = _.merge(data, source);
                                }
                            }
                            //针对该字段的处理写入请求的querystring
                            if(thisProcess.query){
                                if(["GET","HEAD"].includes(method)){
                                    let source = _.set(
                                        {},
                                        thisProcess.query.name,
                                        preResult[key]
                                    );
                                    query = _.merge(query, source);
                                }else{
                                    url += `?${thisProcess.query.name}=${preResult[key]}`
                                }
                            }
                        }
                    }

                    tt = new Date().getTime();
                    callPreApiLog.time = tt-t1;
                }

                //组合header
                if(apiObj.headerReturn && Object.keys(apiObj.headerReturn).length>0) {
                    tempPaths = [];
                    let headerMerge = await getReturn(
                        {
                            result,
                            preResult,
                            customConfig,
                            params,
                            callbackTagMap,
                            tempPaths
                        },
                        apiObj.headerReturn,
                        helper,
                        this.ctx
                    )
                    for(let tempPath of tempPaths){
                        _.unset(headerMerge, tempPath);
                    }
                    headers = _.merge(
                        headers,
                        headerMerge
                    )
                }

                //组合query
                if(apiObj.queryReturn && Object.keys(apiObj.queryReturn).length>0){
                    tempPaths = [];
                    let queryMerge = await getReturn(
                        {
                            result,
                            preResult,
                            customConfig,
                            params,
                            callbackTagMap,
                            tempPaths
                        },
                        apiObj.queryReturn,
                        helper,
                        this.ctx
                    )
                    for(let tempPath of tempPaths){
                        _.unset(queryMerge, tempPath);
                    }
                    query = _.merge(
                        query,
                        queryMerge
                    )
                }

                //组合数据
                if(apiObj.dataMerge && Object.keys(apiObj.dataMerge).length>0){

                    t1 = new Date().getTime();
                    let mergeDataLog = {
                        state: "mergeData"
                    }
                    apiLog.process.push(mergeDataLog);

                    tempPaths = [];
                    let dataMerge = await getReturn(
                        {
                            result,
                            preResult,
                            customConfig,
                            params,
                            callbackTagMap,
                            tempPaths
                        },
                        apiObj.dataMerge,
                        helper,
                        this.ctx
                    )
                    for(let tempPath of tempPaths){
                        _.unset(dataMerge, tempPath);
                    }
                    data = _.merge(
                        data,
                        dataMerge
                    )

                    tt = new Date().getTime();
                    mergeDataLog.time = tt-t1;
                }


                if(method === "SOAP" && apiObj.stringifyPath){

                    t1 = new Date().getTime();
                    let stringifyDataLog = {
                        state: "stringifyData"
                    }
                    apiLog.process.push(stringifyDataLog);

                    _.set(data,
                        apiObj.stringifyPath,
                        JSON.stringify(_.get(data, apiObj.stringifyPath))
                    )

                    tt = new Date().getTime();
                    stringifyDataLog.time = tt-t1;
                }

                //发送数据前是否进行签名
                if(apiObj.sign && apiObj.sign.enabled){

                    t1 = new Date().getTime();
                    let signLog = {
                        state: "sign"
                    }
                    apiLog.process.push(signLog);

                    let tempSign = "";
                    let signObj = {};
                    if(apiObj.sign.useData){
                        signObj = {...data}
                    }
                    if(apiObj.sign.addedParam && typeof apiObj.sign.addedParam == 'object'){

                        tempPaths = [];
                        let signParams = await getReturn(
                            {
                                result,
                                preResult,
                                customConfig,
                                params,
                                callbackTagMap,
                                tempPaths
                            },
                            apiObj.sign.addedParam,
                            helper,
                            this.ctx
                        );
                        for(let tempPath of tempPaths){
                            _.unset(signParams, tempPath);
                        }

                        _.merge(
                            signObj,
                            signParams
                        )
                    }
                    //ascii排序
                    let sorted = helper.sortByAscii(signObj, apiObj.sign.signNull);
                    // let preSignStr = querystring.stringify(sorted);
                    // 不对中文进行URIencode
                    //let preSignStr = querystring.stringify(sorted,'&','=',{ encodeURIComponent: value => value});
                    let pairs = [];
                    for(let sortedKey in sorted){
                        if(apiObj.sign.sortType == "valuesort"){
                            pairs.push(sorted[sortedKey]);
                        }else{
                            pairs.push(`${sortedKey}=${sorted[sortedKey]}`);
                        }
                    }
                    let preSignStr = pairs.join(apiObj.sign.ignoreSeparator?"":"&");

                    console.log(`preSignStr:`,preSignStr);

                    let signPath = apiObj.sign.path?apiObj.sign.path:'sign';
                    logger.info("加密前排序字符串")
                    logger.info(preSignStr);
                    if(apiObj.sign.preSalt){
                        preSignStr = apiObj.sign.preSalt + preSignStr;
                    }
                    if(apiObj.sign.salt){
                        preSignStr += apiObj.sign.salt;
                    }

                    logger.info('签名前字符串：', preSignStr);

                    let signed = "";
                    let signSecretConfig, signSecret;
                    switch(apiObj.sign.algorithm){
                        case "md5":
                            signed = helper.md5(preSignStr, apiObj.sign.encode);
                            break;
                        case "sha1":
                            signed = helper.sha1(preSignStr, apiObj.sign.encode);
                            break;
                        case "hmac":
                            signSecretConfig = _.get(customConfig, apiObj.sign.signSecret);
                            signSecret = signSecretConfig?(signSecretConfig.value||signSecretConfig.default):''
                            signed = helper.hmac(preSignStr, apiObj.sign.encode, signSecret);
                            break;
                        case "RSA-SHA1":
                            signSecretConfig = _.get(customConfig, apiObj.sign.signSecret);
                            signSecret = signSecretConfig?(signSecretConfig.value||signSecretConfig.default):''
                            signed = helper.rsa(preSignStr, apiObj.sign.encode, signSecret);
                            break;
                        case "RSA-SHA256":
                            signSecretConfig = _.get(customConfig, apiObj.sign.signSecret);
                            signSecret = signSecretConfig?(signSecretConfig.value||signSecretConfig.default):''
                            signed = helper.rsa2(preSignStr, apiObj.sign.encode, signSecret);
                            break;
                        case "sm3":
                            signed = helper.sm3(preSignStr);
                            break;
                        default:
                            break;
                    }
                    if(apiObj.sign.toUpperCase){
                        signed = signed.toUpperCase();
                    }else if(apiObj.sign.toLowerCase){
                        signed = signed.toLowerCase();
                    }
                    switch(apiObj.sign.signPosition){
                        case "body":
                            data[signPath] = signed;
                            break;
                        case "query":
                            query[signPath] = signed;
                            break;
                        case "header":
                            headers[signPath] = signed;
                            break;
                        default:
                            break;
                    }

                    tt = new Date().getTime();
                    signLog.time = tt-t1;
                }

                apiLog.url = `${url} \n\r headers: ${_.reduce(_.map(_.toPairs(headers),function(inner){
                    return `[${inner[0]}]:${inner[1]}\n\r`
                }),function(result, item){
                    return result+item
                },'')}`;
                apiLog.data = JSON.stringify(data);
                apiLog.method = method;

                if(apiObj.mock && apiObj.mock.enable){
                    //使用mock
                    t1 = new Date().getTime();
                    let mockLog = {
                        state: "mock"
                    }
                    apiLog.process.push(mockLog);
                    result = apiObj.mock.mockReturn;
                    isRequest = true;
                    tt = new Date().getTime();
                    mockLog.time = tt-t1;
                }else{
                    //实际请求
                    t1 = new Date().getTime();
                    let requestLog = {
                        state: "request"
                    }
                    apiLog.process.push(requestLog);
                    if(method === "SOAP"){
                        logger.info(data);
                        result = await callSoap(url, apiObj.funcName, data, apiObj.createWSDLOptions||{}, apiObj.wsseOptions, logger);
                        apiLog.data = result.xml;
                        delete result.xml;
                    }else{
                        if(method.toLowerCase()=="post" && apiObj.bodyConfig && apiObj.bodyConfig.bodyType && apiObj.bodyConfig.bodyType != 'json'){
                            switch(apiObj.bodyConfig.bodyType){
                                case "xml":
                                    let xmlObj = {};
                                    if(apiObj.bodyConfig.envelope){
                                        xmlObj[apiObj.bodyConfig.envelope] = data
                                    }else{
                                        xmlObj = _.cloneDeep(data);
                                    }
                                    data = xmlInside(xmlObj, apiObj.bodyConfig.cdata);
                                    apiLog.data = data;
                                    break;
                                case "jsonString":
                                    data = JSON.stringify(data);
                                    apiLog.data = data;
                                    break;
                                default:
                                    break;
                            }
                        }
                        
                        let requestOptions = {
                            url,
                            method,
                            data,
                            params: query,
                            headers,
                            dataType: apiObj.dataType || 'json'
                        }

                        if((headers["Content-Type"] || headers["Content-Type".toLowerCase()]) && /application\/x-www-form-urlencoded/.test(headers["Content-Type"] || headers["Content-Type".toLowerCase()])){
                            requestOptions.data = qs.stringify(data)
                        }

                        if((headers["Content-Type"] || headers["Content-Type".toLowerCase()]) && /application\/form-data/.test(headers["Content-Type"] || headers["Content-Type".toLowerCase()])){
                            const form = new FormData();
                            for(let key in data){
                                form.append(key, data[key])
                            }
                            requestOptions.data = form
                        }

                        if(["GET","HEAD"].includes(method)){
                            requestOptions.query = _.merge(query, data);
                            requestOptions.data = {};
                        }

                        let callRes = (await axios(
                            requestOptions
                        ));
                        result = callRes.data;
                        apiLog.callResult.status = callRes.status;
                        if(callRes.status != 200){
                            throw new Error(JSON.stringify(result));
                        }
                    }
                    isRequest = true;
                    tt = new Date().getTime();
                    requestLog.time = tt-t1;
                }

                if(apiObj.dataType === 'text'){
                    logger.info(result.length);
                    if(result.length > 50000){
                        apiLog.result = result.slice(0,50000) + '...';
                    }else{
                        apiLog.result = result;
                    }
                }else{
                    let recordResult = JSON.stringify(result);
                    logger.info(recordResult.length);
                    if(recordResult.length > 50000){
                        apiLog.result = recordResult.slice(0,50000) + '...';
                    }else{
                        apiLog.result = recordResult;
                    }
                }

                if(apiObj.validateConfig && apiObj.validateConfig.validateResult && apiObj.validateConfig.rule){
                    const error = parameter.validate(apiObj.validateConfig.rule, result);
                    if(error){
                        throw new Error(error.map(item=>`接口返回校验失败: ${item.field} 字段不符合要求 ${item.message}, code: ${item.code}`).join('|'));
                    }
                }

                console.log('开始解析数据...')

                if(apiObj.dataType === 'text' && apiObj.convertText){
                    //logger.info(`解析type: ${apiObj.convertText}`)
                    t1 = new Date().getTime();
                    let parseTextLog = {
                        state: "parseText"
                    }
                    apiLog.process.push(parseTextLog);
                    //logger.info('result:')
                    //logger.info(result)

                    switch(apiObj.convertText){
                        case 'xml':
                            result = await parser.parseStringPromise(result);
                            break;
                        case 'json':
                            logger.info('json字符串序列化...')
                            result = JsonParseRecursive(result);
                            break;
                        case 'stringfy':
                            logger.info('json对象字符串化...')
                            result = JSON.stringify(result);
                            break;
                        default:
                            break;
                    }

                    tt = new Date().getTime();
                    parseTextLog.time = tt-t1;

                    //logger.info('解析后数据:')
                    //logger.info(result)
                }
            }

            t1 = new Date().getTime();
            let returnLog = {
                state: "return"
            }
            apiLog.process.push(returnLog);

            //组合返回,不需要组合则直接返回接口返回
            if(apiObj.return){
                tempPaths = [];
                returned = await getReturn({result, preResult, customConfig, params, callbackTagMap, tempPaths}, apiObj.return, helper, this.ctx);
                for(let tempPath of tempPaths){
                    _.unset(returned, tempPath);
                }
            } else {
                returned = result;
            }


            tt = new Date().getTime();
            returnLog.time = tt-t1;

            // logger.info(`***************${url}*****************`);
            // logger.info(data);
            // logger.info(result);

            //缓存请求结果
            if(isRequest && apiObj.cache && apiObj.cache.isCached){

                t1 = new Date().getTime();
                let toCacheLog = {
                    state: "toCache"
                }
                apiLog.process.push(toCacheLog);

                let key = `consult:${app_id}:${apiObj.cache.cacheKey}`;
                let str;
                if(typeof result === "string"){
                    str = result;
                }else{
                    try{
                        str = JSON.stringify(result);
                    }catch(e){
                        throw new Error(`api请求:${apiName}返回解析错误`)
                    }
                }
                let cacheTime = apiObj.cache.cacheTime.default;
                if(apiObj.cache.cacheTime.byReturn){
                    //TODO: 从返回获取数据缓存时间
                }
                await redis.set(key, str, "EX", cacheTime);

                tt = new Date().getTime();
                toCacheLog.time = tt-t1;
            }

            apiLog.callResult.success = true;
            tt = new Date().getTime();
            apiLog.totalTime = tt-t0;

        }catch(e){

            if(apiLog.app_oid && apiLog.api_oid){
                await this.ctx.service.qywechat.alertBug({
                    app_id: apiLog.app_oid,
                    api_id: apiLog.api_oid,
                    message: e.message
                });
            }

            apiLog.callResult.error = e.stack;
            apiLog.callResult.success = false;
            apiLog.process.push({
                state: "error"
            });
            tt = new Date().getTime();
            apiLog.totalTime = tt-t0;
            logger.error(e);
            callError = e.stack;
        }

        //console.log(apiLog)
        //记录调用日志
        //不记录日志
        if(!this.config.ignoreApiLog){
            await model.ApiLog(apiLog).save();
            //logRotate目前的方案太耗mongodb性能，先采用过期清理策略
            //this.ctx.service.apilog.apilogRotate.apilogRotate({api_id: apiLog.api_oid, limit:500});
        }

        //记录日志以后清理日志条目

        return returned || callError || {};
    }


    /**
     * 获取组织可被调用的API列表，输出每个API的tagName和入参示例
     * @param {String}      company_id 组织在医互通系统里的company_id
     */
    async getCompanyApiList ({company_id}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;

        try{
            let appObj = await model.AppConfig.findOne({company_oid: ObjectId(company_id)}).lean();
            if(!appObj){
                return [];
            }
            let apiList = await model.ApiConfig.find(
                {
                    app_oid: appObj._id,
                    tag_oid: {"$exists":true}
                }
            ).populate('tag_oid').populate({
                path: 'company_oid',
                select: "company_name",
                model: model.Company
            }).select('name tag_oid company_oid').lean();

            let tag_oids = apiList.map(item=>item.tag_oid._id);

            let apiGroupItems = await model.ApiGroupItem.find({
                tag_oid: {
                    "$in": tag_oids
                }
            }).select('tag_oid params paramsExample').lean();

            let tagParamMap = {}

            apiGroupItems.forEach(item=>{
                tagParamMap[item.tag_oid]= item;
            })

            for(let apiObj of apiList){
                if(apiObj.tag_oid && tagParamMap[apiObj.tag_oid._id]){
                    apiObj.params = tagParamMap[apiObj.tag_oid._id].params;
                    apiObj.paramsExample = tagParamMap[apiObj.tag_oid._id].paramsExample;
                }else{
                    apiObj.params = {};
                    apiObj.paramsExample = {}
                }
            }

            return apiList;
        }catch(e){
            logger.error(e);
            throw e;
        }
    }

    /**
     * 获取事件执行过程中失败记录
     * @param {String}      company_id 组织在医互通系统里的company_id
     * @param {String}      app_id 接口平台应用id
     * @param {String}      tagName 事件调用时的tagName
     */
    async getCompanyEventFailLogs({company_id, app_id, tagDescription, failTimes, fromCreated, toCreated, fromRecentTried, toRecentTried, fullfilled, page=1, pageSize=20}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;

        try{

            let condition = {};

            if(company_id){
                condition.company_oid = ObjectId(company_id)
            }else if(app_id){
                let appObj = await model.AppConfig.findById(app_id).select('company_oid').lean();
                condition.company_oid = appObj.company_oid;
            }

            if(tagDescription){
                let tags = await model.Tag.find({description: {"$regex": tagDescription}}).lean();
                condition.tagName = {"$in": tags.map(item=>item.tagName)};
            }

            if(failTimes){
                condition.failTimes = failTimes;
            }

            if(fromCreated || toCreated){
                condition.created = {};
                if(fromCreated){
                    condition.created["$gte"] = `${fromCreated} 00:00:00`;
                }
                if(toCreated){
                    condition.created["$lte"] = `${toCreated} 23:59:59`;
                }
            }

            if(fromRecentTried || toRecentTried){
                condition.recentTried = {};
                if(fromRecentTried){
                    condition.recentTried["$gte"] = `${fromRecentTried} 00:00:00`;
                }
                if(toRecentTried){
                    condition.recentTried["$lte"] = `${toRecentTried} 23:59:59`;
                }
            }

            if(fullfilled){
                let ffd;
                switch(fullfilled){
                    case "true":
                        ffd = true;
                        break;
                    case "false":
                        ffd = false;
                        break;
                    default:
                        break;
                }
                condition.fullfilled = ffd;
            }

            let list = await model.EventFailLog.find(condition)
            .sort('created')
            .skip((page-1)*pageSize)
            .limit(pageSize)
            .lean();

            let tagNames = list.map(item=>item.tagName);
            console.log(tagNames);

            let tags = await model.Tag.find({
                tagName: {"$in": tagNames}
            }).lean();

            let tagMap = {};
            for(let item of tags){
                tagMap[item.tagName] = item.description;
            }

            console.log(tagMap);
            list.forEach(item=>{
                item.tagDescription = tagMap[item.tagName]
            })

            let count = await model.EventFailLog.count(condition)

            return {list, count};

        }catch(e){
            logger.error(e);
            throw e;
        }
    }

    /**
     * 重试事件调用
     * @param {String} eventFailLog_id 事件失败日志id
     */
    async recallFailEvent({eventFailLog_id}){

        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;

        let returned;

        try{

            let eventFailLog = await model.EventFailLog.findById(eventFailLog_id).lean();

            let {company_oid, tagName, params} = eventFailLog;

            returned = await this.ctx.service.api.callConfigedApi({
                company_id: company_oid,
                tagName,
                params
            });

            if(typeof returned == 'string'){
                await model.EventFailLog.findByIdAndUpdate(eventFailLog_id, {
                    "$inc": {
                        "failTimes": 1
                    },
                    "$push": {
                        "errorLog": {
                            "message": "",
                            "stack": returned
                        }
                    },
                    "$set": {
                        "recentTried": moment().format('YYYY-MM-DD HH:mm:ss')
                    }
                })
            }else{
                await model.EventFailLog.findByIdAndUpdate(eventFailLog_id, {
                    "$set": {
                        "recentTried": moment().format('YYYY-MM-DD HH:mm:ss'),
                        "fullfilled": true
                    }
                })
            }

        }catch(e){
            logger.error(e);
            throw e;
        }

        return returned;
    }
}

module.exports = ApiService;

function JsonParseRecursive(str){
    console.log(str);
    if(typeof str == 'string'){
        return JsonParseRecursive(JSON.parse(str));
    }else{
        return str;
    }
}

async function getReturn({result, preResult, customConfig, params, callbackTagMap, tempPaths, currentPath=[]}, returnConfig, helper, ctx){
    if(typeof returnConfig === "object"){
        let returned = {};
        for(let key in returnConfig){
            let thisParam = returnConfig[key];
            let paramSource;
            switch(thisParam.from){
                case "return":
                    paramSource = _.get(returned, thisParam.path);
                    break;
                case "dataSource":
                    let queryLog = {
                        process: [{
                            state: "triggedByApi",
                            api_oid: ctx.apiExecutionContext.api_oid,
                            apiName: ctx.apiExecutionContext.apiName
                        }]
                    }
                    let queryResult = await ctx.service.dataSource.sourceConfig.getDataByConfig({
                        _id: thisParam.query_id,
                        params,
                        queryLog
                    })

                    if(queryResult.result){
                        paramSource = queryResult.data
                    }else{
                        console.log('query 错误');
                        console.log(queryResult.message);
                    }
                    break;
                case "preResult":
                    if(thisParam.path){
                        paramSource = _.get(preResult, thisParam.path);
                    }else{
                        paramSource = preResult
                    }
                    break;
                case "system":
                    paramSource = getSystemResult(thisParam.method, thisParam.options, returned);
                    break;
                case "customConfig":
                    let tempconfig = _.get(customConfig, thisParam.path)
                    paramSource = tempconfig.value || tempconfig.default;
                    break;
                case 'result':
                    if(thisParam.path){
                        paramSource = _.get(result, thisParam.path);
                    }else{
                        paramSource = result
                    }
                    if (thisParam.required&&!paramSource) {
                        throw new Error(`api请求:${paramSource}返回解析错误`);
                    }
                    break;
                case 'value':
                    paramSource = thisParam.value;
                    break;
                case 'params':
                    if(thisParam.path){
                        paramSource = _.get(params, thisParam.path);
                    }else{
                        paramSource = params
                    }
                    break;
                case 'callbackUrl':
                    paramSource = callbackTagMap[thisParam.path];
                    break;
                default:
                    if(thisParam.value){
                        paramSource = thisParam.value;
                    }else{
                        paramSource = _.get(result, thisParam.path);
                    }
                    break;
            }
            let tempValue = paramSource;
            if(thisParam.convert){
                tempValue = await convert({
                    result: paramSource,
                    returned,
                    preResult,
                    customConfig,
                    params,
                    callbackTagMap,
                    tempPaths,
                    currentPath: currentPath.concat([key])
                }, thisParam.convert,
                helper, ctx);
            }
            if(thisParam.desensitization){
                tempValue = desensitization(tempValue, thisParam.desensitization);
            }
            _.set(
                returned,
                thisParam.key || key,
                tempValue
            );
            if(thisParam.temp){
                tempPaths.push(key);
            }
        }
        return returned;
    }else{
        return _.get(result, returnConfig);
    }
}

function desensitization(str, type){
    if(["string","number"].includes(typeof str)){
        str = str.toString()
        switch(type){
            case "phone":
                return str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
            case "idCard":
                return str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
            case "passport":
                return str.slice(0,2)+str.slice(2,-3).replace(/./g,"*")+str.slice(-3);
            case "whole":
                return str.replace(/./g, '*');
            default:
                return str;
        }
    }else{
        return str
    }
}

function getSystemResult(method, options, data){
    switch(method){
        case "dateFormat":
            return moment().format('YYYY-MM-DD');
        case "dateFormatSecond":
            return moment().format('YYYY-MM-DD HH:mm:ss');
        case 'dateNow':
            return Date.now().toString();
        case 'secondNow':
            return Date.now().toString().slice(0,-3);
        case 'randomString':
            return crypto.createHash('sha1').update(Math.random().toString()).digest('hex').slice(0, 32);
        case 'stringConcat':            //字段字符串拼接
            return stringConcat(options.expression, data);
        case 'mergeList':               //列表整合，类似于联表
            return mergeList(options.lists, options.primaryKey, data);
        case 'filter':
            return filterList(options.path, options.filter, data);
        default:
            return;
    }
}

function stringConcat(expression, data){
    console.log(expression);
    if(data){
        for(let key in data){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = data[key];
            expression = expression.replace(tempRegex, replaced);
            console.log(expression)
        }
    }
    return expression;
}

/**
 * 列表整合，类似于联表
 * @param {Array} lists 联表数据列表:data的相对路径path和联表字段refKey
 * @param {String} primaryKey 最终主字段
 * @param {*} data 数据来源
 */
function mergeList(lists, primaryKey, data){
    let preMergeObject = {};
    let returnedArray = [];
    if(lists){
        for(let listItem of lists){
            let list = _.cloneDeep(_.get(data, listItem.path));
            let refKey = listItem.refKey;
            if(Array.isArray(list)){
                for(let item of list){
                    if(preMergeObject[item[refKey]]){
                        preMergeObject[item[refKey]] = _.merge(preMergeObject[item[refKey]], item);
                    }else{
                        preMergeObject[item[refKey]] = item;
                    }
                }
            }
        }
    }
    for(let key in preMergeObject){
        preMergeObject[key][primaryKey] = key;
        returnedArray.push(preMergeObject[key]);
    }
    return returnedArray;
}

/**
 * 对象列表筛选
 * @param {*} path              要筛选的数组在data中的相对地址
 * @param {*} filter            筛选匹配json字符串
 * @param {*} data
 * @returns
 */
function filterList(path, filter, data){
    try{
        let filterObj = translateDataString(data, filter)
        return _.filter(_.get(data, path), filterObj);
    }catch(e){
        return _.get(data, path)
    }
}

async function convert({result, returned, preResult, customConfig, params, callbackTagMap, tempPaths, currentPath}, convert, helper, ctx){
    let ret = result;
    let secretConfig;
    switch(convert.type){
        case "Boolean":
            if(convert.enum  && convert.enum.length){
                ret = convertToString(result, convert.default, convert.enum);
            }else{
                ret = Boolean(result);
            }
            break;
        case "String":
            if(convert.decoded){
                result = new Buffer.from(result, convert.coding).toString();
            }
            if(convert.decrypt){
                secretConfig = _.get(customConfig, convert.decryptSecret)
                //当只要求对值转换为base64的
                if (!convert.decryptMethod&&convert.coding) {
                    result = Buffer.from(result).toString(result.coding);
                }
                let secret = secretConfig.value || secretConfig.default;
                if(convert.secretPath){
                    secret = _.get(returned, convert.secretPath);
                }
                //验签时的数据path
                let verifyContent;
                if(convert.verifyPath){
                    verifyContent = _.get(returned, convert.verifyPath)
                }
                result = helper.decrypt(result, convert.decryptMethod, secret, convert.coding, verifyContent)
            }
            if(convert.enum  && convert.enum.length){
                ret = convertToString(result, convert.default, convert.enum);
            }else{
                ret = result.toString();
            }
            if(convert.encrypt){
                secretConfig = _.get(customConfig, convert.encryptSecret)
                let secret = secretConfig.value || secretConfig.default;
                if(convert.secretPath){
                    secret = _.get(returned, convert.secretPath);
                }
                ret = helper.encrypt(ret, convert.encryptMethod, secret, convert.coding, convert.encryptId)
            }
            if(convert.hashed){
                let hashSecret = "";
                if(["hmac"].includes(convert.encryptMethod)){
                    hashSecret = _.get(returned, convert.hashSecretPath);
                }
                ret = helper[convert.encryptMethod](ret, (convert.coding == "byte")?"":convert.coding, hashSecret);
            }
            if(convert.encoded){
                ret = new Buffer.from(ret).toString(convert.coding);
            }
            if(convert.toUpperCase){
                ret = ret.toUpperCase();
            }
            if(convert.toLowerCase){
                ret = ret.toLowerCase();
            }
            break;
        case "Number":
            if(convert.enum && convert.enum.length){
                ret = convertToString(result, convert.default, convert.enum);
            }else{
                ret = Number(result);
            }
            break;
        case "Object":
            let res = result;
            //result是一个json字符串，需要转化
            if(convert.decrypt){
                secretConfig = _.get(customConfig, convert.decryptSecret)
                //当只要求对值转换为base64的
                if (!convert.decryptMethod&&convert.coding) {
                    result = Buffer.from(result).toString(result.coding);
                }
                let secret = secretConfig.value || secretConfig.default;
                if(convert.secretPath){
                    secret = _.get(returned, convert.secretPath);
                }
                //验签时的数据path
                let verifyContent;
                if(convert.verifyPath){
                    verifyContent = _.get(returned, convert.verifyPath)
                }
                res = helper.decrypt(res, convert.decryptMethod, secret, convert.coding, verifyContent)
            }
            if(convert.parse){
                try{
                    res = JSON.parse(res);
                }catch(e){
                    res = {
                        error: 1,
                        message: e.message,
                        source: res
                    }
                }
            }else if(convert.fromXml){
                try{
                    res = await parser.parseStringPromise(res);
                }catch(e){
                    res = {
                        error: 1,
                        message: e.message,
                        source: res
                    }
                }
            }
            ret = res;
            if(convert.return && Object.keys(convert.return).length){
                let innerTempPaths = [];
                ret = await getReturn({result:res, preResult, customConfig, params, callbackTagMap, tempPaths:innerTempPaths, currentPath}, convert.return, helper, ctx)
                for(let tempPath of innerTempPaths){
                    _.unset(ret, tempPath);
                }
            }
            if (convert.stringify) {
                ret = JSON.stringify(ret)
            }
            if(convert.toXml){
                ret = xmlInside(ret, convert.cdata);
            }
            if(convert.encrypt){
                secretConfig = _.get(customConfig, convert.encryptSecret)
                let secret = secretConfig.value || secretConfig.default;
                if(convert.secretPath){
                    secret = _.get(returned, convert.secretPath);
                }
                ret = helper.encrypt(ret, convert.encryptMethod, secret, convert.coding, convert.encryptId)
            }
            if(convert.hashed){
                let hashSecret = "";
                if(["hmac"].includes(convert.encryptMethod)){
                    hashSecret = _.get(returned, convert.hashSecretPath);
                }
                ret = helper[convert.encryptMethod](ret, (convert.coding == "byte")?"":convert.coding, hashSecret);
            }
            if(convert.encoded){
                ret = new Buffer.from(ret).toString(convert.coding);
            }
            if(convert.toUpperCase){
                ret = ret.toUpperCase();
            }
            if(convert.toLowerCase){
                ret = ret.toLowerCase();
            }
            break;
        case "Array":
            if(convert.itemType === "Object" && convert.return){
                ret = [];
                if(!Array.isArray(result)){
                    result = [result];
                }
                for(let key in result){
                    let res = result[key];
                    if(convert.decrypt){
                        secretConfig = _.get(customConfig, convert.decryptSecret)
                        //当只要求对值转换为base64的
                        if (!convert.decryptMethod&&convert.coding) {
                            result = Buffer.from(result).toString(result.coding);
                        }
                        let secret = secretConfig.value || secretConfig.default;
                        if(convert.secretPath){
                            secret = _.get(returned, convert.secretPath);
                        }
                        //验签时的数据path
                        let verifyContent;
                        if(convert.verifyPath){
                            verifyContent = _.get(returned, convert.verifyPath)
                        }
                        res = helper.decrypt(res, convert.decryptMethod, secret, convert.coding, verifyContent)
                    }
                    if(convert.parse){
                        try{
                            res = JSON.parse(res);
                        }catch(e){
                            res = {
                                error: 1,
                                message: e.message,
                                source: res
                            }
                        }
                    }else if(convert.fromXml){
                        try{
                            res = await parser.parseStringPromise(res);
                        }catch(e){
                            res = {
                                error: 1,
                                message: e.message,
                                source: res
                            }
                        }
                    }

                    let innerTempPaths = [];

                    let element = await getReturn({
                        result: res,
                        preResult,
                        customConfig,
                        params,
                        callbackTagMap,
                        tempPaths: innerTempPaths,
                        currentPath: currentPath.concat([key])
                    }, convert.return, helper, ctx);

                    for(let tempPath of innerTempPaths){
                        _.unset(element, tempPath);
                    }

                    if(convert.useResult){
                        element = _.merge(res, element);
                    }

                    if(convert.toXml){
                        element = xmlInside(element, convert.cdata);
                        if(convert.encrypt){
                            secretConfig = _.get(customConfig, convert.encryptSecret);
                            let secret = secretConfig.value || secretConfig.default;
                            if(convert.secretPath){
                                secret = _.get(returned, convert.secretPath);
                            }
                            element = helper.encrypt(element, convert.encryptMethod, secret, convert.coding, convert.encryptId)
                        }
                    }
                    ret.push(element);
                }


            }
            if (convert.stringify) {
                ret = JSON.stringify(ret)
            }
            if(convert.toXml){
                ret = xmlInside(ret, convert.cdata);
            }
            if(convert.encrypt){
                secretConfig = _.get(customConfig, convert.encryptSecret)
                let secret = secretConfig.value || secretConfig.default;
                if(convert.secretPath){
                    secret = _.get(returned, convert.secretPath);
                }
                ret = helper.encrypt(ret, convert.encryptMethod, secret, convert.coding, convert.secretPath)
            }
            if(convert.hashed){
                let hashSecret = "";
                if(["hmac"].includes(convert.encryptMethod)){
                    hashSecret = _.get(returned, convert.hashSecretPath);
                }
                ret = helper[convert.encryptMethod](ret, (convert.coding == "byte")?"":convert.coding, hashSecret);
            }
            if(convert.encoded){
                ret = new Buffer.from(ret).toString(convert.coding);
            }
            if(convert.toUpperCase){
                ret = ret.toUpperCase();
            }
            if(convert.toLowerCase){
                ret = ret.toLowerCase();
            }
            break;
        case "callbackUrl":
            ret = callbackTagMap[result];
            break;
        case "reducedArrayObject":
            let allKeys = _.reduce(result, function(final, item){
                return _.union(final, Object.keys(item))
            }, [])
            ret = _.reduce(result, function(final, item){
                for(let key of allKeys){
                    if(!final[key]){
                        final[key] = [];
                    }
                    final[key].push(item[key])
                }
                return final;
            }, {})
            break;
        case "arrayJoin":
            if(Array.isArray(result)){
                ret = result.join(convert.joinArraySeparator||"");
            }
            break;
        case "stringSplit":
            if(typeof result == 'string'){
                ret = result.split(convert.stringSplitSeparator||"");
            }
            break;
        case "getLength":
            if(Array.isArray(result)){
                ret = result.length;
            }
            break;
        case "slice":
            if(typeof result == 'string'){
                ret = result.slice(convert.sliceStart, convert.sliceEnd);
            }
            break;
        case "encodeURIComponent":
            if(typeof result == 'string'){
                ret = encodeURIComponent(result);
            }
            break;
        case "encodeURI":
            if(typeof result == 'string'){
                ret = encodeURI(result);
            }
            break;
        case "decodeURIComponent":
            if(typeof result == 'string'){
                ret = decodeURIComponent(result);
            }
            break;
        case "decodeURI":
            if(typeof result == 'string'){
                ret = decodeURI(result);
            }
            break;
        default:
            break;
    }
    return ret;
}

function convertToString(source, defaultValue, enumerables){
    let temp = (defaultValue != undefined)?defaultValue:source;
    console.log('******************')
    console.log('temp:',temp);
    for(let item of enumerables){
        console.log('***********')
        console.log(item);
        if(judgeEnum(source, item.condition)){
            temp = item.value;
        }
    }
    return temp;
}

/**
 * 将对象内所有字段转化成xml, 如{abc:"123"} 会转化成 "<abc>123</abc>"
 * @param {*} obj 待转化对象
 * @param {*} cdata 是否包裹<![CDATA[]]>
 */
function xmlInside(obj, cdata){
    let temp = "";
    let keyLength = Object.keys(obj).length;
    for(let key in obj){
        let tempBuilder = new xml2js.Builder({
            headless:true,
            rootName:key,
            renderOpts:{
                pretty:false
            },
            cdata: cdata?'force':false
        });
        if(key == 'root' && keyLength == 1){
            temp += tempBuilder.buildObject(obj);
        }else{
            temp += tempBuilder.buildObject(obj[key]);
        }
    }
    return temp;
}

/**
 * 判断enum项是否成立
 *
 * @param {Object} condition 判断enum项是否成立的条件
 * @return {Boolean} 判断结果,true则原值会被enum[x].value替代
 */
function judgeEnum(returnedValue, condition){
    console.log('*************')
    console.log(returnedValue, condition);
    let result = true;
    for(let key in condition){
        try{
            switch(key){
                case "eq":
                    if(returnedValue != condition[key]){
                        result = false;
                    }
                    break;
                case "ne":
                    if(returnedValue === condition[key]){
                        result = false;
                    }
                    break;
                case "in":
                    if(!condition[key].includes(returnedValue)){
                        result = false;
                    }
                    break;
                case "nin":
                    if(condition[key].includes(returnedValue)){
                        result = false;
                    }
                    break;
                case "regex":
                    if(!condition[key].test(returnedValue)){
                        result = false;
                    }
                    break;
                case "gt":
                    if(returnedValue <= condition[key]){
                        result = false;
                    }
                    break;
                case "gte":
                    if(returnedValue < condition[key]){
                        result = false;
                    }
                    break;
                case "lt":
                    if(returnedValue >= condition[key]){
                        result = false;
                    }
                    break;
                case "lte":
                    if(returnedValue > condition[key]){
                        result = false;
                    }
                    break;
                case "type":
                    if(typeof condition[key] != returnedValue){
                        result = false;
                    }
                    break;
                case "typein":
                    if(!returnedValue.includes(typeof condition[key])){
                        result = false;
                    }
                    break;
                case "typenin":
                    if(returnedValue.includes(typeof condition[key])){
                        result = false;
                    }
                    break;
                case "exists":
                    if((returnedValue && !condition[key]) || (!returnedValue && condition[key])){
                        resutl = false;
                    }v
                    break;
                default:
                    break;
            }
        }catch(e){
            //判断有误，输出判断失败
            result = false;
        }
    }
    return result;
}


function lowerCapital(str){
    return str.charAt(0).toLowerCase()+str.slice(1);
}

function idPath(str){
    return lowerCapital(str)+'_id';
}

function translateData(params, data){
    let dataStr = JSON.stringify(data);
    if(params){
        for(let key in params){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = params[key];
            dataStr = dataStr.replace(tempRegex, replaced);
        }
    }
    return JSON.parse(dataStr);
}

function translateDataString(params, dataStr){
    if(params){
        for(let key in params){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = params[key];
            dataStr = dataStr.replace(tempRegex, replaced);
        }
    }
    return JSON.parse(dataStr);
}

function translateQuery(params, query){
    let dataStr = query;
    if(params){
        for(let key in params){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = params[key]||'';
            dataStr = dataStr.replace(tempRegex, replaced);
        }
    }
    return dataStr;
}

async function callSoapAsync(url, funcName, arg, logger){
    let client = await soap.createClientAsync(url, {
        endpoint: url
    });
    let [result, body, header, xml] = await (_.get(client, funcName+'Async'))(arg);
    result.xml = xml;
    return result;
}

/**
 * 调用Web Service
 * @param {String} url          接口地址
 * @param {String} funcName     方法名称
 * @param {Object} arg          入参，之后会被转化为xml
 */
async function callSoap(url, funcName, arg, createWSDLOptions, wsseOptions, logger){
    return new Promise(function(resolve, reject){
        logger.info(`about to connect soap server on: ${url} ...`);
        let options = {
            endpoint: url
        };
        if(createWSDLOptions.forceSoap12Headers){
            options.forceSoap12Headers = true;
        }
        soap.createClient(url, options, function(err, client){
            if(err){
                reject(err);
            }else{
                logger.info(client);
                if(wsseOptions && wsseOptions.enable){
                    let wsSecurity = new soap.WSSecurity(wsseOptions.username, wsseOptions.password, {});
                    client.setSecurity(wsSecurity);
                }
                let method = _.get(client, funcName);
                method(arg, function(err, result, body, header, xml){
                    if(err){
                        reject(err);
                    }
                    result.xml = xml;
                    resolve(result);
                })
            }
        }, url)
    })
}
