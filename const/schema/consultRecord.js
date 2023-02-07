const mongoose = require('mongoose');

const { STATUS_MAP } = require('../../const/model/record');

const schema = {
    patient_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consultPatient',
        required: true
    },
    hospital: {                         //就诊医院名称
        type: String
    },
    date: {                             //就诊日期
        type: Date
    },
    department: {                       //就诊科室
        type: String
    },
    doctor: {                           //医生姓名
        type: String
    },
    diagnosis: {                        //诊断
        type: String
    },
    pic: {                              //检查报告？？？
        type: String
    },
    status: {                           //就诊记录审核状态
        type: String,
        enum: Object.keys(STATUS_MAP)
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