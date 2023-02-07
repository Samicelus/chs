'use strict';

const mongoose = require('mongoose');

const schema =  {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    hisFreq: {                          //his系统中频次id
        type: String 
    },
    hisFreqDesc: {                      //his系统中频次描述
        type: String
    },
    hisFreqAlias: {                     //his系统中频次别名
        type: String
    },
    cardinal: {                        //用药频次基数中频率(分子)
        type: Number
    },
    cardinalDay: {                     //用药频次基数中每天(分母)
        type: Number,
        default: 1
    }
};

module.exports = schema;
