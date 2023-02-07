const mongoose = require('mongoose');

const schema = {
    api_oid: { 
        type: mongoose.Types.ObjectId,
        ref: 'apiConfig'
    },
    api: {
        type: Object
    },
    versionTag: {
        type: String
    }
}

module.exports = schema;