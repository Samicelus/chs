'use strict';
const moment = require('moment');
moment.locale('zh-cn');
const schema = require('../../const/schema/queryConfig');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'queryConfig');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const QueryConfigSchema = new Schema(schema, {versionKey: false, minimize: false});

    QueryConfigSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return conn.model('queryConfig', QueryConfigSchema);
};