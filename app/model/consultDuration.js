'use strict';

const schema = require('../../const/schema/consultDuration');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultDuration');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDurationSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultDuration', ConsultDurationSchema);
};