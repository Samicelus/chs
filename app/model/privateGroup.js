'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'privateGroup');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    //医互通group表
    const GroupSchema = new Schema({
        group_huaxi_id: String,
        company_id: String,
        group_name: String,
        group_special: String,
        parent_id: String,
        group_parents: Array,
        enable: Number,
        is_temp: Number,
        person_num: Number,
        ns_group_id: String,  // 南山医院云竹平台内的部门id
        other_sys_id: String, // 骨科系统中的主键
    
        created: String,
        modified: String
    }, { versionKey: false });

    return conn.model('private_group', GroupSchema);
};
