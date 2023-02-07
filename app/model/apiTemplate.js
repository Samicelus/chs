'use strict';

const schema = require('../../const/schema/apiTemplate');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiTemplate');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiTemplate', ApiTemplateSchema);
};