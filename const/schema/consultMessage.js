const mongoose = require('mongoose');

const {SENT_MAP} = require('../model/message');

const schema = {
    consult_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consult',
        required: true
    },
    from: {
        type: String,
        enum: ['doctor', 'patient', 'system']
    },
    subtype: {
        type:String
    },
    content: {
        type: String
    },
    image: {
        type: String
    },
    voice: {
        type: String
    },
    voiceTime: {
        type: Number
    },
    codeBar: {
        type: String
    },
    diagnosis: {
        type: String
    },
    shared: {
        type: Boolean
    },
    isRetrieved: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    sentStatus: {
        type: String,
        enum: Object.keys(SENT_MAP),
        default: 'wait'
    },
    read: {
        type: Boolean,
        default: false
    },
    created: {
        type: String
    },
    updated: {
        type: Date,
        default: Date.now()
    }
}

module.exports = schema;