const mongoose = require('mongoose');

const schema = {
    app_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'appConfig',
        required: true
    },
    name: {
        type: String
    },
    collection_name: {
        type: String
    },
    operation: {
        type: String
    },
    query: {
        type: Object
    },
    extra_operation: {
        type: Object
    },
    source_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'dataSource',
        required: true
    },
    collection_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'customizedModel',
        required: true
    },
    // 参数示例
    params_example: {
        type: Object
    }
}

module.exports = schema;
