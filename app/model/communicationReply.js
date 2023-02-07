'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'communication_reply');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    //医互通company_user表，仅作关联查询用
    const CompanyUserSchema = new Schema({
        company_id: String,
    question_id: String,
    subject_id: String,
    message_id: String,
    content: String,
    url: String, // 当消息为图文的时候，对应的链接
    image: String,
    voice: String,
    voice_time: Number,
    codeBar: String,
    server_ids: String,
    type: String,
    subtype: String, // news图文消息
    diagnosis: String,
    notes: String,
    advices: Array,
    cda_id: String,
    tempCardInfo: Object,
    created: String,
    updated: String,
    shared: Boolean,
    isRetrieved: Boolean,
    isDeleted: Boolean
    }, { versionKey: false });

    return conn.model('communication_reply', CompanyUserSchema);
};