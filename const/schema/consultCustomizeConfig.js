const mongoose = require('mongoose');

const schema = {
    app_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'appConfig',
        required: true,
    },
    customizeConfig: {                  //自定义设置(可开放给医院)
        type: Object
    },
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    }
}

module.exports = schema;