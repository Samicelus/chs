'use strict';

const schema = require('../../const/schema/sender');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'sender');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const SenderSchema = new Schema(schema, {versionKey: false});

    return conn.model('sender', SenderSchema);
};
