'use strict';

const schema = require('../../const/schema/appConfig');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'appConfig');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const AppConfigSchema = new Schema(schema, {versionKey: false});

    return conn.model('appConfig', AppConfigSchema);
};
