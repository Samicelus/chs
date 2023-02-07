'use strict';

const schema = require('../../const/schema/requestBlock');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'requestBlock');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const RequestBlockSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('requestBlock', RequestBlockSchema);
};