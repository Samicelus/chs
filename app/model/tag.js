'use strict';

const schema = require('../../const/schema/tag');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'tag');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const TagSchema = new Schema(schema, {versionKey: false, minimize: false});

    return conn.model('tag', TagSchema);
};