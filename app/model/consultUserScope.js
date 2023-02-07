'use strict';

const schema = require('../../const/schema/consultUserScope');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultUserScope');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultUserScopeSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultUserScope', ConsultUserScopeSchema);
};