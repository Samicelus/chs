'use strict';

const schema = require('../../const/schema/consultDiag');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultDiag');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDiagSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultDiag', ConsultDiagSchema);
};
