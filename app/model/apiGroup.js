'use strict';

const schema = require('../../const/schema/apiGroup');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiGroup');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiGroupSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiGroup', ApiGroupSchema);
};