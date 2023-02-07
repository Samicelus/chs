'use strict';

const mongoose = require('mongoose');

const schema =  {
    user_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consultUser'
    },
    scope: [{                                //用户可见范围
        hospitalId:{
            type: Number
        },
        hospitalName:{
            type: String
        },
        company_oid:{
            type: mongoose.Types.ObjectId
        }
    }],
    created: {
        type: Date,
        default: Date.now()
    }
};

module.exports = schema;