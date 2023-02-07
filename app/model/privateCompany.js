'use strict';

const schema = require('../../const/schema/company');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'privateCompany');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const CompanySchema = new Schema(schema, {versionKey: false});

    return conn.model('private_company', CompanySchema);
};
