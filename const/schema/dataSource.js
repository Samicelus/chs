const mongoose = require('mongoose');

const schema = {
    app_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'appConfig',
        required: true
    },
    sourceName: {
        type: String
    },
    description: {
        type: String
    },
    dbType: {
        type: String
    },
    connectStr: {
        type: String
    },
    dbName: {
        type: String
    },
    login: {
        type: String
    },
    password: {
        type: String
    },
    tested: {
        type: Boolean,
        default: false
    },
    testTime: {
        type: String
    },
    created: {
        type: String
    }
}

module.exports = schema;