'use strict';

const schema = require('../../const/schema/callbackLog');
const moment = require('moment');
moment.locale('zh-cn');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'callbackLog');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const callbackLogSchema = new Schema(schema, {versionKey: false, minimize: false});

    callbackLogSchema.index({"app_oid":1, "callResult.success":1, "callResult.read":1});
    callbackLogSchema.index({"callbackConfig_oid":1, "callResult.success":1, "callResult.read":1});
    
    callbackLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
        doc.created = new Date();
        doc.updated = new Date();
    })

    return conn.model('callbackLog', callbackLogSchema);
};