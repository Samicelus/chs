'use strict';

const schema = require('../../const/schema/consultFreq');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultFreq');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultFreqSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultFreq', ConsultFreqSchema);
};