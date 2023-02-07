const mongoose = require('mongoose');
const {MsgTypes_Map} = require('../model/sender');

const schema = {
    user_oids: [
        {
            type: mongoose.Types.ObjectId
        }
    ],
    group_oids: [
        {
            type: mongoose.Types.ObjectId
        }
    ],
    party_ids: [
        {
            type: Number
        }
    ],
    company_oid: {                                          //获取accesstoken用
        type: mongoose.Types.ObjectId,
        ref: 'company'
    },
    smartapp_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'smartapps'
    },
    msgtype: {
        type: String,
        enum: Object.keys(MsgTypes_Map),
        required: true
    },
    text: {                                                 //文本消息内容
        content: {
            type: String
        }
    },
    image: {                                                //图片消息内容
        content: {
            type: String
        },
        url: {
            type: String
        }
    },
    voice: {
        url: {
            type: String
        }
    },
    video: {
        url: {
            type: String
        },
        title: {
            type: String
        },
        description: {
            type: String
        }
    },
    file: {
        url: {
            type: String
        }
    },
    textcard: {
        title: {
            type: String
        },
        description: {
            type: String
        },
        url: {
            type: String
        },
        btntxt: {
            type: String
        }
    },
    news: {
        articles:[
            {
                title: {
                    type: String
                },
                description: {
                    type: String
                },
                url: {
                    type: String
                },
                picurl: {
                    type: String
                }
            }
        ]
    },
    mpnews: {
        articles:[
            {
                title: {
                    type: String
                },
                author: {
                    type: String
                },
                content_source_url: {
                    type: String
                },
                content: {
                    type: String
                },
                digest: {
                    type: String
                },
                url: {
                    type: String
                }
            }
        ]
    },
    markdown: {
        content: {
            type: String
        }
    },
    miniprogram_notice: {
        appid: {
            type: String
        },
        page: {
            type: String
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        emphasis_first_item:{
            type: Boolean
        },
        content_item: [
            {
                key: {
                    type: String
                },
                value: {
                    type: String
                }
            }
        ]
    },
    taskcard: {
        title: {
            type: String
        },
        description: {
            type: String
        },
        url: {
            type: String
        },
        task_id: {
            type: String
        },
        btn: [
            {
                key: {
                    type: String
                },
                name: {
                    type: String
                },
                replace_name: {
                    type: String
                },
                color: {
                    type: String
                },
                is_bold: {
                    type: Boolean
                }
            }
        ]
    },
    source: {
        type: String
    },
    tried: {                        //尝试推送次数
        type: Number,
        default: 0
    },
    succeeded: {                      //成功次数
        type: Number,
        default: 0
    }
}

module.exports = schema;