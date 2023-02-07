'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    hisDuration: {                          //his系统中疗程id
        type: String 
    },
    hisDurationDesc: {                      //his系统中疗程描述
        type: String 
    },
    hisDurationAlias: {                     //his系统中疗程别名
        type: String 
    },
    cardinal: {                             //疗程基数，用以计算建议开药量
    //建议开药量 = 疗程基数 * （频次频率/频次天数） * （单次剂量基数/开药规格基数）
        type: Number
    }
};

module.exports = schema;
