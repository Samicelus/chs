const mongoose = require('mongoose');
const {PATIENT_SEX_MAP} = require('../model/patient');

const schema = {
    emtId: {                       //用户中心id
        type: String
    },
    profile: {                      //患者资料
        identityCard: {            //患者身份证号
            type: String,
            unique: true
        },
        name: {                     //患者姓名
            type: String
        },
        phone: {                    //患者手机号
            type: String
        },
        age: {                      //患者年龄
            type: String
        },
        sex: {                      //患者性别
            type: String,
            enum: Object.keys(PATIENT_SEX_MAP)
        },
        birth: {                    //患者出生日期
            type: String
        },
        address: {                  //患者地址
            type: String
        }
    },
    cards:{                         //患者就诊卡信息
        type: Object
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