const mongoose = require('mongoose');

const schema = {
    groupName: {
        type: String,
        unique: true
    },
    docs: {
        word: {
            url: {
                type: String
            },
            name: {
                type: String
            },
            uid: {
                type: String
            }
        },
        pdf: {
            url: {
                type: String
            },
            name: {
                type: String
            },
            uid: {
                type: String
            }
        }
    },
    created: {
        type: String
    },
    updated: {
        type: String
    }
}

module.exports = schema;