const mongoose = require('mongoose');

const schema = {
    company_id: {                        //医院id
        type: String
    },
    lastSyncDate: {
        type: String
    }
}

module.exports = schema;