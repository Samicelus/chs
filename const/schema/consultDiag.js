'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    hisDiag: {                          //his系统中诊断id
        type: String 
    },
    hisDiagDesc: {                      //his系统中诊断描述
        type: String
    },
    hisDiagAlias: {                     //his系统中诊断别名
        type: String
    },
    ICD9: {                             //学术编码
        type: String
    }
};

module.exports = schema;