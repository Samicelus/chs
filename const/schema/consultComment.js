const mongoose = require('mongoose');

const { COMMENT_STATE_MAP } = require('../model/comment');

const schema = {
    consult_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consult',
        required: true
    },
    doctor_oid:{
        type: mongoose.Types.ObjectId,
        ref: 'consultDoctor',
        required: true
    },
    patient_oid:{
        type: mongoose.Types.ObjectId,
        ref: 'consultPatient',
        required: true
    },
    comments: {                         //评论
        type: String
    },
    score: {                            //评分
        type: Number
    },
    anonymous: {
        type: Boolean,
        default: true
    },
    state: {                            //评论状态
        type: String,
        enum: Object.keys(COMMENT_STATE_MAP),
        default: 'normal'
    },
    created: {
        type: String
    }
}

module.exports = schema;