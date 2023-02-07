const mongoose = require('mongoose');
const {API_METHOD_MAP, HASH_METHOD_MAP, DATA_TYPE_MAP} = require('../module/consult');
const schema = {
    protocal: {
        type: String
    },
    host: {
        type: String
    },
    url: {                                      //调用api的url
        type: String
    },
    method: {                                   //接口方法
        type: String,
        enum: Object.keys(API_METHOD_MAP),
        default: "GET"
    },
    funcName: {                                 //接口方法为SOAP的时候才使用
        type: String
    },
    sign: {                                     //是否需要签名校验
        enabled: {
            type: Boolean,
            default: false
        },
        salt: {                                 //加盐(也可作为放置在最后的secret)
            type: String
        },
        algorithm: {                            //签名算法
            type: String,
            enum: Object.keys(HASH_METHOD_MAP),
            default: 'md5'
        },
        path: {                                 //签名字段命名
            type: String,
        },
    },
    cache: {                                    //结果缓存设置
        isCached: {
            type: Boolean,
            default: false
        },
        cacheKey: {                             //缓存字段名称,最终名称为:
                                                //consult:[app_id]:[cacheKey]
            type: String
        },
        renew: {
            type: Boolean,
            default: true
        },
        cacheTime: {
            byReturn: {
                type: Boolean,
                default: false
            },
            default: {                          //缓存默认过期时间单位秒
                type: Number
            }
        }
    },
    bodyConfig: {
        bodyType: {
            type: String,
            enum: ['json','xml']
        },
        cdata: {
            type: Boolean
        },
        envelope: {
            type: String
        }
    },
    dataType: {
        type: String,
        enum: ['text','json'],
        default: 'json'
    },
    convertText:{                               //若dataType为'text'时,转化结果为json
        type: String,
        enum: ['xml','json',''],
        default: ''
    },
    mock: {
        enable: {
            type: Boolean,
            default: false
        },
        dataType:{
            type: String,
            enum: Object.keys(DATA_TYPE_MAP),
            default: "json"
        },
        mockReturn: {
            type: Object,
            default: {}
        }
    },
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    }
}

module.exports = schema;