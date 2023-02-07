'use strict';

const schema = require('../../const/schema/consultUser');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultUser');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultUserSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultUser', ConsultUserSchema);
};