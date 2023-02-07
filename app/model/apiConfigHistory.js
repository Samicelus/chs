'use strict';

const schema = require('../../const/schema/apiConfigHistory');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiConfigHistory');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiConfigHistorySchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('apiConfigHistory', ApiConfigHistorySchema);
};