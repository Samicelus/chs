const mongoose = require('mongoose');
const { DATA_TYPE_MAP, SIGNPOSITION_MAP, SORTTYPE_MAP} = require('../module/consult');
const schema = {
    app_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'appConfig'
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
    name: {
        type: String
    },
    callbackUrl: {
        type: String
    },
    callbackTag: {
        type: String
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
    methodConfigs:[
        {
            method: {
                type: String,
                required: false
            },
            verifySignature: {
                enable: {
                    type: Boolean,
                    default: false
                },
                algorithm: {
                    type: String
                },
                coding: {
                    type: String
                },
                secret: {
                    type: String
                },
                enableSeparator: {
                    type: Boolean,
                    default: false
                },
                separator: {
                    type: String,
                    required: false,
                    default: "&"
                },
                signature: {
                    path: {
                        type: String
                    },
                    origin: {
                        type: String,
                        enum: Object.keys(SIGNPOSITION_MAP)
                    }
                },
                verifykeys: [{
                    path: {
                        type: String
                    },
                    origin: {
                        type: String
                    }
                }],
                sortType: {
                    type: String,
                    enum: Object.keys(SORTTYPE_MAP)
                },
                signNull: {                             //空值是否参与签名，sortType为keysort的时候生效
                    type: Boolean
                },
                preSalt: {                              //头部加盐
                    type: String
                },
                salt: {                                 //加盐(也可作为放置在最后的secret)
                    type: String
                }
            },
            bodyType: {
                type: String,
                enum: Object.keys(DATA_TYPE_MAP),
                default: "json"
            },
            convertText: {
                type: String
            },
            callApis: [{
                type: mongoose.Types.ObjectId,
                ref: 'apiConfig'
            }],
            asReturn: {
                type: mongoose.Types.ObjectId,
                ref: 'apiConfig'
            },
            keyAsReturn: {
                type: Boolean,
                default: false
            },
            returnKeyPath: {
                type: String
            }
        }
    ],   
    created: {
        type: Date
    },
    updated: {
        type: Date
    }
}

module.exports = schema;
