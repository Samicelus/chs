'use strict';
//const {SEND_STATE_MAP, DIAGNOSIS_TYPE_MAP} = require('../../const/model/advice');

const schema = require('../../const/schema/consultAdvice');

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'consultAdvice');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const ConsultAdviceSchema = new Schema(schema, {versionKey: false});

    return conn.model('consultAdvice', ConsultAdviceSchema);
};