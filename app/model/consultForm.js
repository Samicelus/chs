'use strict';

const schema = require('../../const/schema/consultForm');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultForm');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultFormSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultForm', ConsultFormSchema);
};