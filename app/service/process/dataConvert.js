'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;

const crypto = require('crypto');
const xml2js = require('xml2js-force-cdata');
const parser = new xml2js.Parser({
    explicitArray: false
});
const Parameter = require('parameter');
const parameter = new Parameter();

class DataConvertService extends Service {
    /**
     * 数据组合与转化模块:
     * 
     * 通过配置，将现有上下文数据进行转化
     * 
     * @param {Object}      inputData 输入数据
     * @param {Object}      dataConfig 数组组合与转化配置
     * @param {Object}      apiLog 调用上下文
     */
    async convertData ({inputData, dataConfig, name, boxLog}){
        const {ctx, logger, app} = this;

        let t1, tt;
        t1 = new Date().getTime();
        let constructDataLog = {
            id: dataConfig._id,
            name,
            type: 'data'
        };

        try{
            let tempPaths = [];
            let currentPath = [];
            
            boxLog.process.push(constructDataLog);
            
            let dataMerge = await getReturn(
                {
                    inputData,
                    tempPaths,
                    currentPath
                }, 
                dataConfig.return
            )
            for(let tempPath of tempPaths){
                _.unset(dataMerge, tempPath);
            }

            tt = new Date().getTime();
            constructDataLog.time = tt-t1;
            constructDataLog.status = "Success";

            return {result: true, data:dataMerge};
        }catch(e){
            tt = new Date().getTime();
            constructDataLog.time = tt-t1;
            constructDataLog.status = "Fail";
            constructDataLog.error = e.stack;
            logger.error(e);
            return {result: false, data:{}};
        }
    }
}

module.exports = DataConvertService;

async function getReturn({inputData, tempPaths, currentPath=[], returned={}}, dataConfig){
    let result = {};
    if(typeof dataConfig === "object"){
        for(let key in dataConfig){
            let thisParam = dataConfig[key];
            let paramSource;
            switch(thisParam.from){
                case "return":              //现有配置数据
                    paramSource = _.get(returned, thisParam.path);
                    break;
                case 'result':             //输入
                    if(thisParam.path){
                        paramSource = _.get(inputData, thisParam.path);
                    }else{
                        paramSource = inputData
                    }
                    if (thisParam.required&&!paramSource) {
                        throw new Error(`api请求:${paramSource}返回解析错误`);
                    }
                    break;
                case 'value':           //固定值
                    paramSource = thisParam.value;
                    break;
                default:
                    if(thisParam.value){
                        paramSource = thisParam.value;
                    }else{
                        paramSource = _.get(inputData, thisParam.path);
                    }
                    break;
            }
            let tempValue = paramSource;
            if(thisParam.convert){
                tempValue = await convert({
                    inputData: paramSource,
                    tempPaths,
                    currentPath: currentPath.concat([key]),
                    returned
                }, thisParam.convert);
            }
            if(thisParam.desensitization){
                tempValue = desensitization(tempValue, thisParam.desensitization);
            }
            _.set(
                result,
                thisParam.key || key,
                tempValue
            );
            _.set(
                returned,
                thisParam.key || key,
                tempValue
            );
            if(thisParam.temp){
                tempPaths.push(currentPath.concat([key]).join('.'));
            }
        }
        return result;
    }else{
        return _.get(inputData, dataConfig);
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


async function convert({inputData, tempPaths, currentPath, returned}, convert){
    let ret = inputData;
    let secretConfig;
    switch(convert.type){
        case "Boolean":
            if(convert.enum){
                ret = convertToString(inputData, convert.default, convert.enum);
            }
            break;
        case "String":
            if(convert.decrypt){
                secretConfig = _.get(inputData, convert.decryptSecret)
                //当只要求对值转换为base64的
                if (!convert.decryptMethod&&convert.coding) {
                    inputData = Buffer.from(inputData).toString(convert.coding);
                }
                inputData = decrypt(inputData, convert.decryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            if(convert.enum){
                ret = convertToString(inputData, convert.default, convert.enum);
            }
            if(convert.encrypt){
                secretConfig = _.get(inputData, convert.encryptSecret)
                ret = encrypt(ret, convert.encryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            break;
        case "Number":
            ret = Number(inputData);
            break;
        case "Object":
            let res = inputData;
            //result是一个json字符串，需要转化
            if(convert.decrypt){
                secretConfig = _.get(inputData, convert.decryptSecret)
                res = decrypt(res, convert.decryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            if(convert.parse){
                res = JSON.parse(res);
            }else if(convert.fromXml){
                res = await parser.parseStringPromise(res);
            }
            ret = res;
            if(convert.return && Object.keys(convert.return).length){
                ret = await getReturn({inputData:res, tempPaths, currentPath, returned}, convert.return)
            }
            if (convert.stringify) {
                ret = JSON.stringify(ret);
            }
            if(convert.toXml){
                ret = xmlInside(ret, convert.cdata);
            }
            if(convert.encrypt){
                secretConfig = _.get(inputData, convert.encryptSecret)
                ret = encrypt(ret, convert.encryptMethod, secretConfig.value || secretConfig.default, convert.coding)
            }
            break;
        case "Array":
            if(convert.itemType === "Object" && convert.return){
                ret = [];
                if(!Array.isArray(inputData)){
                    inputData = [inputData];
                }
                for(let key in inputData){
                    let res = inputData[key];
                    if(convert.decrypt){
                        secretConfig = _.get(inputData, convert.decryptSecret);
                        res = decrypt(res, convert.decryptMethod, secretConfig.value || secretConfig.default, convert.coding)
                    }
                    if(convert.parse){
                        res = JSON.parse(res);
                    }

                    let element = await getReturn({
                        inputData: res,
                        tempPaths,
                        currentPath: currentPath.concat([key]),
                        returned
                    }, convert.return);

                    if(convert.useResult){
                        element = _.merge(res, element);
                    }

                    if(convert.toXml){
                        element = xmlInside(element, convert.cdata);
                        if(convert.encrypt){
                            secretConfig = _.get(inputData, convert.encryptSecret);
                            element = encrypt(element, convert.encryptMethod, secretConfig.value || secretConfig.default, convert.coding)
                        }
                    }

                    ret.push(element);
                }
            }
            break;
        case "callbackUrl":
            ret = callbackTagMap[inputData];
            break;
        case "reducedArrayObject":
            let allKeys = _.reduce(inputData, function(final, item){
                return _.union(final, Object.keys(item))
            }, [])
            ret = _.reduce(inputData, function(final, item){
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
            if(Array.isArray(inputData) &&  convert.joinArraySeparator){
                ret = inputData.join(convert.joinArraySeparator);
            }
            break;
        default:
            break;
    }
    return ret;
}

function convertToString(source, defaultValue, enumerables){
    let temp = defaultValue!==undefined?defaultValue:source;
    for(let item of enumerables){
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
                case "nin":
                    if(condition[key].includes(returnedValue)){
                        result = false;
                    }
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

/**
 * 加密
 * @param {String} str 明文
 * @param {*} algorithm 加密算法 (exm. 'aes-128-cbc')
 * @param {*} secret 密钥 注：若长度不符合算法要求会作为密码生成对应长度密钥
 * @param {*} coding 输出编码 (exm. 'hex')
 */
function encrypt(str, algorithm, secret, coding){
    let config = algorithm.split('-')
    let iv;
    switch(config[2]){
        case 'ecb':
            iv = null;
            break;
        default:
            iv = Buffer.alloc(16, 0);
            break;
    }
    if(secret.length != config[1]/8){
        secret = crypto.scryptSync(secret, '', config[1]/8);
    }
    const cipher = crypto.createCipheriv(algorithm, secret, iv);
    let encrypted = cipher.update(str, 'utf8', coding);
    encrypted += cipher.final(coding);
    return encrypted;
}

/**
 * 解密
 * @param {String} str 密文
 * @param {*} algorithm 加密算法 (exm. 'aes-128-cbc')
 * @param {*} secret 密钥 注：若长度不符合算法要求会作为密码生成对应长度密钥
 * @param {*} coding 输出编码 (exm. 'hex')
 */
function decrypt(str, algorithm, secret, coding){
    let config = algorithm.split('-')
    let iv;
    switch(config[2]){
        case 'ecb':
            iv = null;
            break;
        default:
            iv = Buffer.alloc(16, 0);
            break;
    }
    if(secret.length != config[1]/8){
        secret = crypto.scryptSync(secret, '', config[1]/8);
    }
    const decipher = crypto.createDecipheriv(algorithm, secret, iv);
    let decrypted = decipher.update(str, coding, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

