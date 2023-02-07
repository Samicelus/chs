'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'iflow_steps');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const IflowStepSchema = new Schema({
        app_id: String,
        flow_id: String,
        company_id: String,
        step_key: String,
        step_name: String,
        step_type: String,
        step_subtype: String,
        ext: Object,
        step_out: Array,
        step_data: Object,
        jump_type: String, // 是否允许掉过节点  repetition：表示跳过去重步骤
        jump_level: String, // 是否允许掉过等级节点  level
        approver_type: Number, // 1是固定处理人，17是固定处理人超时通过，18超时流转到下一个节点，19超时提醒
        time_out: Number, // 过期时间
        handle_uids: Array,
        approve_order: { type: Boolean, default: false }, // true表示流程节点人员审批顺序执行，false不顺序执行
        approver_ref4logic: Object,
        special_logic: Object,
        item_visibility: Array,
        handle_opration: Object,
        handle_opration_sorts: Array,
        select_handler_option: Array,
        service_params: Object,
        advisors: Array,
        created: String,
        pre_hand_time: String,
        check_expired: Number,
        timeout_object: Object// 17:{is_send_notice:boolean, auto_time: number}; 18:{week_times: [number](星期几), auto_time: number(几个小时默认8个小时，就是8点),is_open:number(1开启 2关闭 是否开启统一流转)}; 19:{}  黄伟新增
    }, {versionKey: false});

    return conn.model('iflow_steps', IflowStepSchema);
};
