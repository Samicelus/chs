'use strict';

const schema = require('../../const/schema/box');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'box');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const BoxSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('box', BoxSchema);
};