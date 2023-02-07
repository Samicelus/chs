const mongoose = require('mongoose');

const schema = {
    tagName: {                          //标签名称
        type: String,
        unique: true,
        index: true
    },
    description: {                      //标签中文描述
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