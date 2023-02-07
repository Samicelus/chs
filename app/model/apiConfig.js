'use strict';

const schema = require('../../const/schema/apiConfig');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiConfig');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiConfigSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiConfig', ApiConfigSchema);
};