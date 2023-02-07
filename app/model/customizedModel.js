'use strict';
const moment = require('moment');
moment.locale('zh-cn');
const schema = require('../../const/schema/customizedModel');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'customizedModel');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const CustomizedModelSchema = new Schema(schema, {versionKey: false, minimize: false});

    CustomizedModelSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return conn.model('customizedModel', CustomizedModelSchema);
};