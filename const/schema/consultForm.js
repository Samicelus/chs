'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    hisForm: {                          //his系统中剂型id
        type: String 
    },
    hisFormDesc: {                      //his系统中剂型描述
        type: String
    },
    hisFormAlias: {                      //his系统中剂型别名
        type: String
    },
};

module.exports = schema;
