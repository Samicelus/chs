'use strict';

const schema = require('../../const/schema/eventFailLog');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'eventFailLog');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const CompanySchema = new Schema(schema, {versionKey: false});

    return conn.model('eventFailLog', CompanySchema);
};
