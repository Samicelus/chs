'use strict';

const schema = require('../../const/schema/apiGroupItem');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiGroupItem');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiGroupItemSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiGroupItem', ApiGroupItemSchema);
};