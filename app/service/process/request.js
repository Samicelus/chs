'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;
const soap = require('soap');
const crypto = require('crypto');
const xml2js = require('xml2js-force-cdata');
const parser = new xml2js.Parser({
    explicitArray: false
});
const Parameter = require('parameter');
const parameter = new Parameter();

class RequestService extends Service {
    /**
     * 请求外部api并返回:
     * 
     * @param {Object}      inputData  入参数据
     * @param {Object}      headerData  请求头数据
     * @param {Object}      signData  签名数据
     */
    async processRequest ({inputData, headerData, signData, requestConfig, name, boxLog}){
        const {ctx: { helper }, logger, app: {redis}} = this;

        let t1, tt;
        t1 = new Date().getTime();
        let processRequestLog = {
            id: requestConfig.id,
            name,
            type: 'request',
            callResult: {}
        }

        try{

            let result;
            let isRequest = false;
            boxLog.process.push(processRequestLog);

            if(requestConfig.cache && requestConfig.cache.isCached){

                let key = `api-platform:${boxLog.box_oid}:${requestConfig.cache.cacheKey}`;

                let cached = await redis.get(key);
                if(cached){
                    try {
                        result = JSON.parse(cached);
                    }catch(e){
                        result = cached;
                    }
                }

            }
            
            let url;
            //没有缓存结果或缓存已过期
            if(!result){

                let hostRoute = [];
                if(requestConfig.host){
                    hostRoute.push(requestConfig.host);
                }
                if(requestConfig.url){
                    hostRoute.push(requestConfig.url);
                }
                
                url = (requestConfig.protocal||"") + hostRoute.join('/');

                let method = requestConfig.method;
                let headers = {
                    "Content-Type": "application/json"
                };
                if(headerData){
                    headers = _.merge(
                        headers,
                        headerData
                    )
                }             

                //发送数据前是否进行签名
                if(requestConfig.sign && requestConfig.sign.enabled){

                    let signObj = {...signData}
                    
                    //ascii排序
                    let sorted = helper.sortByAscii(signObj);

                    let preSignStr = querystring.stringify(sorted,'&','=',{ encodeURIComponent: value => value});
                    let signPath = requestConfig.sign.path?requestConfig.sign.path:'sign';

                    switch(requestConfig.sign.algorithm){
                        case "md5":
                            if(requestConfig.sign.salt){
                                preSignStr += requestConfig.sign.salt;
                            }
                            inputData[signPath] = helper.md5(preSignStr);
                            break;
                        case "sha1":
                            if(requestConfig.sign.salt){
                                preSignStr += requestConfig.sign.salt;
                            }
                            inputData[signPath] = helper.sha1(preSignStr);
                            break;
                        case "hmac":
                            inputData[signPath] = helper.hmac(preSignStr,requestConfig.sign.salt?requestConfig.sign.salt:'');

                            break;
                        default:
                            break;
                    }

                }

                if(requestConfig.mock && requestConfig.mock.enable){
                    //使用mock
                    result = requestConfig.mock.mockReturn;

                }else{
                    //实际请求
                    if(method === "SOAP"){
                        result = await callSoap(url, requestConfig.funcName, inputData);
                        processRequestLog.data = result.xml;
                        isRequest = true;
                        delete result.xml;
                    }else{
                        if(method.toLowerCase()=="post" && requestConfig.bodyConfig && requestConfig.bodyConfig.bodyType && requestConfig.bodyConfig.bodyType != 'json'){
                            switch(requestConfig.bodyConfig.bodyType){
                                case "xml":
                                    let xmlObj = {};
                                    xmlObj[requestConfig.bodyConfig.envelope] = inputData
                                    inputData = xmlInside(xmlObj, requestConfig.bodyConfig.cdata);
                                    processRequestLog.data = inputData;
                                    break;
                                default:
                                    break;
                            }
                        }
                        let callRes = (await this.ctx.curl(url,
                            {
                                method,
                                data: inputData,
                                headers,
                                dataType: requestConfig.dataType || 'json'
                            }
                        ));
                        isRequest = true;
                        result = callRes.data;
                        processRequestLog.callResult.status = callRes.status;
                        if(callRes.status != 200){
                            throw new Error(JSON.stringify(result));
                        }
                    }
                }

                if(requestConfig.dataType === 'text'){
                    processRequestLog.result = result;
                }else{
                    processRequestLog.result = JSON.stringify(result);
                }

                if(requestConfig.dataType === 'text' && requestConfig.convertText){

                    switch(requestConfig.convertText){
                        case 'xml':
                            result = await parser.parseStringPromise(result);
                            break;
                        case 'json':
                            result = JSON.parse(result);
                            break;
                            
                        case 'stringfy':
                            result = JSON.stringify(result);
                            break;
                        default:
                            break;
                    }

                }
            }

            //缓存请求结果
            if(isRequest && requestConfig.cache && requestConfig.cache.isCached){

                let key = `api-platform:${boxLog.box_oid}:${requestConfig.cache.cacheKey}`;
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
                let cacheTime = requestConfig.cache.cacheTime.default;
                if(requestConfig.cache.cacheTime.byReturn){
                    //TODO: 从返回获取数据缓存时间
                }
                await redis.set(key, str, "EX", cacheTime);

            }

            processRequestLog.callResult.success = true;
            tt = new Date().getTime();
            processRequestLog.time = tt-t1;
            processRequestLog.status = "Success";

            return {result: true, data:result};
        }catch(e){
            tt = new Date().getTime();
            processRequestLog.time = tt-t1;
            processRequestLog.status = "Fail";
            processRequestLog.error = e.stack;

            logger.error(e);
            return {result: false, data:e.stack};
        }
    }
}

module.exports = RequestService;


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
 * 调用Web Service
 * @param {String} url          接口地址
 * @param {String} funcName     方法名称
 * @param {Object} arg          入参，之后会被转化为xml
 */
async function callSoap(url, funcName, arg){
    return new Promise(function(resolve, reject){
        soap.createClient(url,function(err, client){
            if(err){
                reject(err);
            }else{
                let method = _.get(client, funcName);
                method(arg, function(err, result, body, header, xml){
                    if(err){
                        reject(err);
                    }
                    result.xml = xml;
                    resolve(result);
                })
            }
        })
    })
}