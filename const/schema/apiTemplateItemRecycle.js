const mongoose = require('mongoose');
const schema = {
    content: {
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