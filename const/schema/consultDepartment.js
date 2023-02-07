'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    name: {                                 //在线问诊科室名称
        type: String
    },
    image: {                                //科室图片
        type: String
    },
    description: {
        type: String
    },
    hisId: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    }
};

module.exports = schema;