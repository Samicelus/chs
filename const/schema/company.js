const mongoose = require('mongoose');

const schema = {
    hos_id: {                        //资源中心的医院id
        type: String
    },
    creator_uid: {
        type: String
    },
    creator_nickname: {
        type: String
    },
    creator_avatar: {
        type: String
    },
    company_name: {
        type: String
    },
    company_alias: {
        type: String
    },
    company_logo: {
        type: String
    },
    show_id: {
        type: String
    },
    person_num: {
        type: Number
    },
    payed_level: {
        type: String
    },
    payed_time: {
        type: String
    },
    managers: {
        type: Array
    },
    enable: {
        type: Number
    },
    atd_config: {
        type: String
    },
    ext_config: {
        type: Object
    },
    config_init: {
        type: Object
    },
    weixinqy: {
        corpId: {
            type: String,
            mapName: "企业微信corpId"
        },
        corpSecret: {
            type: String,
            mapName: "企业微信corpSecret"
        },
        encodingAesKey: {
            type: String,
            mapName: "企业微信encodingAesKey"
        }
    },
    CA_variable: {
        type: Object
    },
    created: {
        type: String
    },
    modified: {
        type: String
    }
}

module.exports = schema;