'use strict';
//const { STATUS_MAP } = require('../../const/model/record');

const schema = require('../../const/schema/consultRecord');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultRole');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultRecordSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultRecord', ConsultRecordSchema);
};