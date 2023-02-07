'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'privateGroupUser');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    //医互通group_user表，仅作关联查询用
    const CompanyUserSchema = new Schema({
        company_id:String,
        group_id: String,
        group_name:String,
        group_name_en: String,
        user_id:String,
        nickname:String,
        nickname_en:String,
        user_role:Number,
        is_temp:Number,
        created: String,
        modified: String
    }, { versionKey: false });

    return conn.model('private_group_user', CompanyUserSchema);
};
