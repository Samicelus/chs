const mongoose = require('mongoose');

const schema = {
    queryConfig_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'queryConfig',
        required: true
    },
    created: {
        type: String
    },
    status: {
        type: String
    },
    parameter: {
        type: Object
    },
    actual_parameter: {
        type: Object
    },
    error_message: {
        type: String
    },
    url: {
        type: String
    },
    process: [{                     //执行过程
        state: {
            type: String
        },
        time: {
            type: Number
        },
        api_oid: {
            type: mongoose.Types.ObjectId,
            ref: 'apiConfig',
            required: false
        },
        apiName: {
            type: String
        }
    }],
    total_time: {
        type: Number
    },
}

module.exports = schema;
