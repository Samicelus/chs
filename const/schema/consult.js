const mongoose = require('mongoose');

const schema = {
    app_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'appConfig',
        required: true
    },
    subjectId: {                        //患者端咨询单号,用于和患者端同步信息
        type: String
    },
    consultComment_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consultComment',
        required: false
    },
    doctor_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'consultDoctor',
        required: true,
        mapName: '医生详情'
    },
    patient_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'consultPatient',
        required: true,
        mapName: '患者详情'
    },
    usedCard: {                             //使用的卡号
        type: String,
        mapName: '使用的卡号'
    },
    complaint: {                            //主诉
        title: {
            type: String,
            mapName: '主述'
        },
        image: {
            type: String
        }
    },
    record_oid: {                           //患者就诊记录id
        type: mongoose.Types.ObjectId,
        ref: 'consultRecord',
        required: false
    },
    admId: {                                //挂号id
        type: String,
        mapName: '挂号id'
    },
    recordAuthed: {                         //就诊记录是否已审核
        type: Boolean,
        default: false,
        mapName: '就诊记录是否已审核'
    },
    isClosed: {                             //是否已关闭
        type: Boolean,
        default: false,
        mapName: '是否已关闭'
    },
    isCanceled: {                           //是否已取消
        type: Boolean,
        default: false,
        mapName: '是否已取消'
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