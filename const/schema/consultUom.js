'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    hisUom: {                               //his系统中计价单位id
        type: String 
    },
    hisUomDesc: {                           //his系统中计价单位描述
        type: String 
    },
    hisDurationAlias: {                     //his系统中计价单位别名
        type: String 
    },
    cardinal: {                             //开药规格基数
        type: Number
    }
};

module.exports = schema;