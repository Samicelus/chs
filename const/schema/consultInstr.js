'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    hisInstr: {                          //his系统中用法id
        type: String 
    },
    hisInstrDesc: {                      //his系统中用法描述
        type: String
    },
    hisInstrAlias: {                      //his系统中用法别名
        type: String
    }
};

module.exports = schema;