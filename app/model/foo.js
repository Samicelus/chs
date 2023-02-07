'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'foo');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const FooSchema = new Schema({
        id: { type: String },
        count: { type: Number },
    }, {versionKey: false});

    return conn.model('foo', FooSchema);
};
