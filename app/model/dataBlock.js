'use strict';

const schema = require('../../const/schema/dataBlock');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'dataBlock');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const DataBlockSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('dataBlock', DataBlockSchema);
};