'use strict';

const schema = require('../../const/schema/apiTemplateItemRecycle');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiTemplateItemRecycle');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateItemRecycleSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiTemplateItemRecycle', ApiTemplateItemRecycleSchema);
};