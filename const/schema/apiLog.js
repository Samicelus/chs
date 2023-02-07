const mongoose = require('mongoose');
const schema = {
    app_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'appConfig'
    },
    api_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiConfig'
    },
    apiGroup_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiGroup'
    },
    apiTemplate_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiTemplate'
    },
    tag_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'tag'
    },
    params: {                       //调用接口时传入的params,经过stringify
        type: String
    },
    url: {                          //实际调用的url
        type: String
    },
    method: {                       //调用方法
        type: String
    },
    data: {                         //最终调用入参，经过stringify
        type: String
    },
    result: {                       //本次获取到的结果，经过stringify
        type: String
    },
    resultFromCache: {              //本次是否从cache中获取到结果
        type: Boolean,
        default: false
    },
    cachedKey:{                     //缓存key
        type: String
    },
    callResult: {
        success:{                         //调用是否成功
            type: Boolean,
            default: true
        },
        status: {
            type: Number
        },
        read: [{
            type: mongoose.Types.ObjectId,
            ref: 'consultUser'
        }],
        error: {                 //调用时发生的错误
            type: Object
        }
    },
    process: [{                     //执行过程
        state: {
            type: String
        },
        time: {
            type: Number
        }
    }],
    totalTime: {
        type: Number
    },
    log_time:{
        type: String
    },
    versionTag: {
        type: String
    },
    created: {
        type: Date
    }
}

module.exports = schema;