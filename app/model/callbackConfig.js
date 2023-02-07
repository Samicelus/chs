'use strict';

const schema = require('../../const/schema/callbackConfig');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'callbackConfig');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const callbackConfigSchema = new Schema(schema, {versionKey: false, minimize: false});

    callbackConfigSchema.post('validate', function(doc){
        doc.created = new Date();
        doc.updated = new Date();
    })

    return conn.model('callbackConfig', callbackConfigSchema);
};