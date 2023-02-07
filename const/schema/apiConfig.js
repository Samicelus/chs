const mongoose = require('mongoose');
const {AUTH_MODE_MAP, API_METHOD_MAP, HASH_METHOD_MAP, ENCODE_MAP, SIGNPOSITION_MAP, DATA_TYPE_MAP, SORTTYPE_MAP} = require('../module/consult');
const schema = {
    app_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'appConfig'
    },
    tag_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'tag'
    },
    apiTemplate_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiTemplate',
        required: false
    },
    apiGroup_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiGroup',
        required: false
    },
    defaultApi:{                                //默认api,不可删除
        type: Boolean,
        default: true
    },
    type: {                                     //同一类型接口的不同形态
        type: String,
        required: false
    },
    name: {                                     //api名称
        type: String,
        required: true
    },
    threshold: {                                //超时阈值, 不超时则为0
        type: Number,
        default: 0
    },
    protocal: {
        type: String
    },
    host: {
        type: String
    },
    url: {                                      //调用api的url
        type: String
    },
    pre: {                                      //前置接口设置
        hasPre: {                               //是否有前置接口
            type: Boolean,
            default: false
        },
        apiName: {                              //校验模式为token时校验的api
            type: String
        },
        processReturn: {                        //如何处理上一个请求的结果,
                                                //并加入到本此请求
            type: Object
        }
    },
    method: {                                   //接口方法
        type: String,
        enum: Object.keys(API_METHOD_MAP),
        default: "GET"
    },
    funcName: {                                 //接口方法为SOAP的时候才使用
        type: String
    },
    createWSDLOptions: {                        //获取wsdl时的选项（第一次soap请求连接）
        type: Object
    },
    wsseOptions: {                              //soap请求安全校验选项
        type: Object
    },
    stringifyPath: {                            //接口方法为SOAP的时候可能会对某层数据做stringify
        type: String
    },
    queryReturn: {                              //return模式配置的query,在非get等模式有效
        type: Object,
        required: false
    },
    headers:{                                   //自定义headers
        type: Object,
        default: {}
    },
    headerReturn:{                              //return模式配置的header,需要兼容老数据，所以没有复用header字段
        type: Object,
        default: {}
    },
    queryReturn:{                              //return模式配置的query
        type: Object,
        default: {}
    },
    data: {                                     //接口默认入参
        type: Object,
        required: false
    },
    dataMerge: {                                //描述如何组合取到得数据
        type: Object,
        default: {}
    },
    sign: {                                     //是否需要签名校验
        enabled: {
            type: Boolean,
            default: false
        },
        useData:{                               //是否对发送的数据进行签名
            type: Boolean,
            default: false
        },
        signSecret: {                           //有些hash方式，如Hmac需要设置密钥
            type: String
        },
        signNull: {                             //空值参与签名
            type: Boolean,
            default: false
        },
        ignoreSeparator: {                             //忽略 & 作为分隔符
            type: Boolean,
            default: false
        },
        addedParam: {                           //定义其他签名字段
            type: Object,
            default: {}
        },
        preSalt: {                              //头部加盐
            type: String
        },
        salt: {                                 //加盐(也可作为放置在最后的secret)
            type: String
        },
        algorithm: {                            //签名算法
            type: String,
            enum: Object.keys(HASH_METHOD_MAP),
            default: 'sha1'
        },
        encode: {
            type: String,
            enum: Object.keys(ENCODE_MAP)
        },
        signPosition: {
            type: String,
            enum: Object.keys(SIGNPOSITION_MAP),
            default: 'body'
        },
        path: {                            //签名再命名
            type: String,
        },
        toLowerCase: {
            type: Boolean
        },
        toUpperCase: {
            type: Boolean
        },
        sortType: {
            type: String,
            enum: Object.keys(SORTTYPE_MAP)
        }
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
            enum: ['json','xml', 'jsonString']
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
    return: {                                   //apiService返回,均为对象
                                                //key为对象:
                                                //{from:"",path:""}
        type: Object,
        default: {}
    },
    mockReturn: {                               //是否以tag对应的返回示例作为返回
        type: Boolean,
        default: false
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
    validateConfig: {                                 //对结果进行validate
        validateResult: {
            type: Boolean,
            default: false
        },
        rule: {
            type: Object
        }
    },
    versionTag: {
        type: String
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