'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'privateCompanyUsers');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    //医互通company_user表，仅作关联查询用
    const CompanyUserSchema = new Schema({
        company_id  : String,
        company_role: String,
        emt_doctor_id: String, // emt的id
        user_id     : String,
        employee_id : String,
        last_employee_id : String,
        nickname    : String,
        nickname_en : String,
        avatar      : String,
        title       : String,
        idcard      : String,
        extConfig   : String,
        phoneno     : {type: String, default: ''},
        email       : {type: String, default: ''},
        isDisable   : Number, // 人员禁用功能（1表示被禁用，0表示没有被禁用）
        created     : String,
        modified    : String
    }, { versionKey: false });

    return conn.model('private_company_users', CompanyUserSchema);
};