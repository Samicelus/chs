'use strict';

const schema = require('../../const/schema/consultDepartment');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultDepartment');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultDepartmentSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultDepartment', ConsultDepartmentSchema);
};
