const mongoose = require('mongoose');

const schema = {
    company: {
        hospitalId: {
            type: Number
        },
        hospitalName: {
            type: String
        }
    },
    company_oid: {                              //医互通使用
        type: mongoose.Types.ObjectId
    },
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    qywechat: {
        secret: {
            type: String,
            default: "",
            mapName: '企业微信应用secret'
        },
        agentid: {
            type: Number,
            default: 1,
            mapName: '企业微信应用agentid'
        },
        alertBot: {
            webhook: {
                type: String,
                mapName: '企业微信机器人webhook地址'
            },
            mentioned_list: {
                type: Array,
                mapName: '群成员userid，所有人@all'
            }
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