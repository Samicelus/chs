'use strict';
const moment = require('moment');
moment.locale('zh-cn');

const schema = require('../../const/schema/pushLog');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'pushLog');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const PushLogSchema = new Schema(schema, {versionKey: false});

    PushLogSchema.index({"pushResult.success":1, "sender_oid":1, "log_time":-1});
    PushLogSchema.index({"pushResult.success":1, "log_time":-1});
    PushLogSchema.index({"sender_oid":1, "log_time":-1});
    PushLogSchema.index({"log_time":-1});

    PushLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return conn.model('pushLog', PushLogSchema);
};
