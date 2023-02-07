'use strict';
const moment = require('moment');
moment.locale('zh-cn');

const schema = require('../../const/schema/iflowLog');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'iflowLog');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const IflowLogSchema = new Schema(schema, {versionKey: false});

    IflowLogSchema.index({"iflowResult.success":1, "company_oid":1, "smartApp_oid":1, "handler_oid":1, "created":-1, "totalTime":1});
    IflowLogSchema.index({"company_oid":1, "smartApp_oid":1, "handler_oid":1, "created":-1});
    IflowLogSchema.index({"company_oid":1, "smartApp_oid":1, "created":-1});
    IflowLogSchema.index({"company_oid":1, "created":-1});
    IflowLogSchema.index({"smartApp_oid":1, "created":-1});
    IflowLogSchema.index({"company_oid":1, "handler_oid":1, "created":-1});
    IflowLogSchema.index({"handler_oid":1, "created":-1});
    IflowLogSchema.index({"smartApp_oid":1, "handler_oid":1, "created":-1});
    IflowLogSchema.index({"created":-1});
    IflowLogSchema.index({"iflowResult.success":1,  "created":-1, "totalTime":1});

    IflowLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return conn.model('iflowLog', IflowLogSchema);
};
