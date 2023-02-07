'use strict';

const schema = require('../../const/schema/consult');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consult');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultSchema = new Schema(schema, {versionKey: false});

    return conn.model('consult', ConsultSchema);
};
