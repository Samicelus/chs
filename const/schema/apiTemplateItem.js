const mongoose = require('mongoose');
const {API_METHOD_MAP, HASH_METHOD_MAP} = require('../module/consult');
const schema = {
    apiTemplate_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiTemplate'
    },
    tag_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'tag'
    },
    type: {                                     //同类多态接口
        type: String,
        required: false
    },
    defaultApi:{                                //默认api,不可删除
        type: Boolean,
        default: true
    },
    name: {                                     //api名称
        type: String,
        required: true
    },
    protocal: {
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
    stringifyPath: {                            //接口方法为SOAP的时候可能会对某层数据做stringify
        type: String
    },
    headers:{                                   //自定义headers
        type: Object,
        default: {}
    },
    data: {                                     //接口默认入参
        type: Object,
        required: false
    },
    dataSource: [{                               //描述如何根据入参取数据
        path: {
            type: String
        },
        dbType: {
            type: String
        },
        sourceName: {
            type: String
        },
        collectionName: {
            type: String
        },
        query: {
            type: String
        },
        where: {
            type: String,
            validate: {
                validator: function(v){
                    return !(/select|update|delete|truncate|join|union|exec|insert|drop|count|'|"|;|>|<|%/i.test(v))
                }
            },
            message: props => `'${props.value}' rejected with sql inject rule!`
        },
        joins:[{
            joinKey: {
                type: String
            },
            joinType: {
                type: String
            },
            joinModel: {
                type: String
            },
            targetKey: {
                type: String
            }
        }]
    }],
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
        signNull: {                             //空值参与签名
            type: Boolean,
            default: false
        },
        addedParam: {                           //定义其他签名字段
            type: Object,
            default: {}
        },
        salt: {                                 //加盐(也可作为放置在最后的secret)
            type: String
        },
        algorithm: {                            //签名算法
            type: String,
            enum: Object.keys(HASH_METHOD_MAP),
            default: 'sha1'
        },
        path: {                            //签名再命名
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
    return: {                                   //apiService返回,均为对象
                                                //key为对象:
                                                //{from:"",path:""}
        type: Object,
        default: {}
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
    created: {
        type: String
    },
    updated: {
        type: String
    }
}

module.exports = schema;