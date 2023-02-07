'use strict';

const schema = require('../../const/schema/syncStructRecord');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'syncStructRecord');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const SyncStructRecordSchema = new Schema(schema, {versionKey: false});

    return conn.model('syncStructRecord', SyncStructRecordSchema);
};
