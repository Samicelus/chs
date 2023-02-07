const mongoose = require('mongoose');

const schema = {
    sender_oid: {                           //对应的sender
        type: mongoose.Types.ObjectId,
        ref: 'sender'
    },
    message_id: {                           //记录在messages队列中的id
        type: String
    },
    process: [{                             //执行过程
        state: {
            type: String
        },
        time: {
            type: Number
        }
    }],
    totalTime: {
        type: Number
    },
    log_time: {
        type: String
    },
    sendData: {
        type: Object
    },
    pushResult: {
        success: {
            type: Boolean,
            default: true
        },
        errorMessage: {
            type: String
        }
    }
}

module.exports = schema;