'use strict';

const schema = require('../../const/schema/apiTemplateCallbackItem');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'apiTemplateCallbackItem');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ApiTemplateCallbackItemSchema = new Schema(schema, {versionKey: false, minimize: false});

    ApiTemplateCallbackItemSchema.post('validate', function(doc){
        doc.created = new Date();
        doc.updated = new Date();
    })

    return conn.model('apiTemplateCallbackItem', ApiTemplateCallbackItemSchema);
};