'use strict';

const schema = require('../../const/schema/consultUom');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultUom');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultUomSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultUom', ConsultUomSchema);
};
