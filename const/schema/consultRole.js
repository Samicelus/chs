'use strict';

const {MODULE_MAP, POWER_MAP} = require('../../const/model/admin');


const schema =  {
    name: {
        type: String,
        unique: true
    },
    access: [{
        module: {
            type: String,
            enum: Object.keys(MODULE_MAP)
        },
        power: [{
            type: String,
            enum: Object.keys(POWER_MAP)
        }]
    }],
    isAdmin: {
        type: Boolean,
        default: false
    },
    defaultRole: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now()
    }
};

module.exports = schema;

