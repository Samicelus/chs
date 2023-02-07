'use strict';
const moment = require('moment');
moment.locale('zh-cn');
const schema = require('../../const/schema/queryConfigLog');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'queryConfigLog');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const QueryConfigLogSchema = new Schema(schema, {versionKey: false, minimize: false});

    QueryConfigLogSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return conn.model('queryConfigLog', QueryConfigLogSchema);
};