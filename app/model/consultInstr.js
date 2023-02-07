'use strict';

const schema = require('../../const/schema/consultInstr');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultInstr');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultInstrSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultInstr', ConsultInstrSchema);
};
