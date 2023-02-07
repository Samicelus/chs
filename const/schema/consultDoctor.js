const mongoose = require('mongoose');

const {DOCTOR_PROPERTY_MAP, TEXT_PUSH_TYPE_MAP, CA_STATE_MAP} = require('../model/doctor');

const schema = {
    consultUser_oid: {                       //关联医生中心的user表的_id
        type: mongoose.Types.ObjectId,
        ref: 'consultUser',
    },
    user_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
    },
    company_oid: {                  //关联组织架构id,同一个emt_id可以在多个
                                    //company下开通在线问诊
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    profile: {                      //医生资料
        property: {                 //属性 doctor-医生, nurse-护士,
                                    //technician-技师
            type: String,
            enum: Object.keys(DOCTOR_PROPERTY_MAP)
        },
        profession: {               //职称
            type: String
        },
        sections: {                 //擅长领域
            type: String
        },
        description: {              //简介
            type: String
        },
        department_oid: {                //在线问诊的科室id,与组织架构无关
            type: mongoose.Types.ObjectId,
            ref: 'consultDepartment',
            required: false,
            mapName: '医生问诊科室id'
        },
        onlineDesc: {               //上线时间描述,
                                    //展示给患者以便了解期望回复时间
            type: String
        }
    },
    consultTypes:{                          //针对问诊类型的设置
        text: {                             //图文问诊
            isOpen: {                       //是否开通,审核通过后开通
                type: Boolean,
                default: false
            },
            isAvailable: {                  //是否可用,医生可以操作
                type: Boolean,
                default: false
            },
            price: {                        //咨询一次的价格
                type: Number
            },
            push: {                         //推送设置
                pushType: {                 //推送方式:即时/每小时/每天...
                    type: String,
                    enum: Object.keys(TEXT_PUSH_TYPE_MAP)
                },
                pushTime: {                 //推送时间,仅当pushType为oneDay时
                                            //格式为HH:mm
                    type: String,
                }
            },
            autoClose: {                    //超时自动关闭,默认医生第一条回复后
                                            //24小时会自动关闭问诊
                type: Boolean,
                default: true
            }
        },
        phone: {                            //电话问诊
            isOpen: {                       //是否开通,审核通过后开通
                type: Boolean,
                default: false
            },
            isAvailable: {                  //是否可用,医生可以操作
                type: Boolean,
                default: false
            },
            price: {                        //咨询一次的价格
                type: Number
            }
        },
        video: {                            //视频问诊
            isOpen: {                       //是否开通,审核通过后开通
                type: Boolean,
                default: false
            },
            isAvailable: {                  //是否可用,医生可以操作
                type: Boolean,
                default: false
            },
            price: {                        //咨询一次的价格
                type: Number
            }
        }
    },
    isRecommended: {                        //是否上推荐栏
        type: Boolean,
        default: false
    },
    order: {                                //医生排序
        type: Number
    },
    hisPower: {                             //跟his功能相关的设置
        hisId: {                            //his系统中医生的id
            type: String,
            mapName: '医生hisId'
        },
        canGiveAdvice: {                    //是否可以开处方
            type: Boolean,
            default: false,
            mapName: '是否可以开处方'
        },
        canGiveLab: {                       //是否可以开检验
            type: Boolean,
            default: false,
            mapName: '是否可以开检验'
        },
        canGivePicture: {                   //是否可以开检查
            type: Boolean,
            default: false,
            mapName: '是否可以开检查'
        },
        canGiveRecord: {                    //是否可以写入病历
            type: Boolean,
            default: false,
            mapName: '是否可以编写病历'
        },
    },
    CA: {                                   //跟CA相关信息
        openId: {                           //医生在CA系统中的id
            type: String
        },
        idCard: {                           //CA注册时使用的身份证号
            type: String
        },
        professionIdType: {                 //CA注册时使用的资格证类别
            type: String
        },
        professionId: {                     //资格证号
            type: String
        },
        state: {                            //CA认证状态码
            type: String,
            enum: Object.keys(CA_STATE_MAP),
            default: '-1'
        },
        password: {                         //医生在CA系统中的密码
            type: String
        },
        signPng: {                          //医生在CA中设置的签章
            type: String
        },
        passErrCount: {                     //
            type: Number
        }
    },
    synchronized: {                         //是否已同步到患者端
        type: Boolean,
        default: false
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