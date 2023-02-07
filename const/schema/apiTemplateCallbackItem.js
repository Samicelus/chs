const mongoose = require('mongoose');
const {API_METHOD_MAP, HASH_METHOD_MAP} = require('../module/consult');
const schema = {
    apiTemplate_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiTemplate'
    },
    name: {
        type: String
    },
    callbackUrl: { 
        type: String
    },
    callbackTag: {
        type: String
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    }
}

module.exports = schema;