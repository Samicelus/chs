const mongoose = require('mongoose');
const schema = {
    company: {
        hospitalId: {
            type: Number
        },
        hospitalName: {
            type: String
        }
    },
    tag_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'tag'
    },
    name: {                                     //api名称
        type: String,
        required: true
    },
    topology: {
        type: Object
    },
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    }
}

module.exports = schema;