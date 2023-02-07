const mongoose = require('mongoose');
const schema = {
    app_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'appConfig'
    },
    callbackConfig_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'callbackConfig'
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
    requestIp: {
        type: String
    },
    requestBody: {
        type: Object
    },
    requestHeader: {
        type: Object
    },
    result: {
        type: String
    },
    process: [{
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
    log_time: {
        type: String
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    }
}

module.exports = schema;