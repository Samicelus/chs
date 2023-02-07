'use strict';

const schema = require('../../const/schema/consultRole');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultRole');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultRoleSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultRole', ConsultRoleSchema);
};