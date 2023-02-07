const mongoose = require('mongoose');

const schema = {
    apiGroup_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'apiGroup'
    },
    tag_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'tag'
    },
    itemName: {
        type: String
    },
    params: {
        type: Object
    },
    paramsExample: {
        type: Object
    },
    return: {
        type: Object
    },
    returnExample: {
        type: Object
    },
    created: {
        type: String
    },
    updated: {
        type: String
    }
}

module.exports = schema;