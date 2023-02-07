'use strict';
const moment = require('moment');
moment.locale('zh-cn');
const schema = require('../../const/schema/consultComment');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultComment');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultCommentSchema = new Schema(schema, {versionKey: false});

    ConsultCommentSchema.post('validate', function(doc){
        doc.created = new moment().format('YYYY-MM-DD HH:mm:ss');
    })

    return conn.model('consultComment', ConsultCommentSchema);
};