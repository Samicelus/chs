const mongoose = require('mongoose');

const schema = {
    source_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'dataSource',
        required: true
    },
    name: {
        type: String
    },
    modelSchema: {
        type: Object
    },
    created: {
        type: String
    }
}

module.exports = schema;