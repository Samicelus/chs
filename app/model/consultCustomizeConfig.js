'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultCustomizeConfig');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultCustomizeConfigSchema = new Schema({
        app_oid:{
            type: mongoose.Types.ObjectId,
            ref: 'appConfig'
        },
        config:{
            type: Object
        },
        created: {
            type: Date,
            default: Date.now()
        },
        updated: {
            type: Date,
            default: Date.now()
        }
    }, {versionKey: false});

    return conn.model('consultCustomizeConfig', ConsultCustomizeConfigSchema);
};
