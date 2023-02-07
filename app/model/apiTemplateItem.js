'use strict';

const schema = require('../../const/schema/apiTemplateItem');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiTemplateItem');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateItemSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiTemplateItem', ApiTemplateItemSchema);
};