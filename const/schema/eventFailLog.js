const mongoose = require('mongoose');

const schema = {
    company_oid: {                                         //医院id
        type: mongoose.Types.ObjectId,
        ref: 'company'
    },
    tagName: {
        type: String
    },
    params: {
        type: Object
    },
    failTimes: {                                    //失败次数
        type: Number
    },
    errorLog: {
        type: Array
    },
    recentTried: {                                  //最近重试时间
        type: String
    },
    fullfilled: {
        type: Boolean
    },
    created: {                                      //失败时间
        type: String
    },
    updated: {                                      //修改时间
        type: String
    }
}

module.exports = schema;