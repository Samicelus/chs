'use strict';
const schema = require('../../const/schema/apiLog');
const moment = require('moment');
moment.locale('zh-cn');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiLog');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiLogSchema = new Schema(schema, {versionKey: false, minimize: false});

    ApiLogSchema.index({"api_oid":1, "callResult.success":1, "callResult.read":1, "log_time":1, "totalTime":1});
    ApiLogSchema.index({"api_oid":1, "app_oid":1, "callResult.success":1, "callResult.read":1});
    ApiLogSchema.index({"app_oid":1, "callResult.success":1, "callResult.read":1});
    ApiLogSchema.index({"api_oid":1, "callResult.success":1, "callResult.read":1});
    ApiLogSchema.index({"api_oid":1, "log_time":1});
    ApiLogSchema.index({"api_oid":1});

    ApiLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
        doc.created = new Date();
    })

    return conn.model('apiLog', ApiLogSchema);
};