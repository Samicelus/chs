const mongoose = require('mongoose');

const schema = {
    apiGroup_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiGroup'
    },
    templateName: {
        type: String
    },
    version: {                      //模板版本号
        type: String
    },
    created: {
        type: String
    },
    updated: {
        type: String
    }
}

module.exports = schema;