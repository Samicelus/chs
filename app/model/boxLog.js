'use strict';
const schema = require('../../const/schema/boxLog');
const moment = require('moment');
moment.locale('zh-cn');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'box');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const BoxLogSchema = new Schema(schema, {versionKey: false, minimize: false});

    BoxLogSchema.post('validate', function(doc){
        doc.log_time = new moment().format('YYYY-MM-DD HH:mm:ss');
        doc.created = new Date();
    })

    return conn.model('boxLog', BoxLogSchema);
};