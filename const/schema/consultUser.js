'use strict';

const mongoose = require('mongoose');

const schema =  {
    role_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consultRole',
        required: true
    },
    scope_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consultUserScope'
    },
    user_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    nickname: {
        type: String
    },
    username: {
        type: String,
        required:true,
        unique: true
    },
    password: {
        type: String
    },
    defaultPwd: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now()
    }
};

module.exports = schema;