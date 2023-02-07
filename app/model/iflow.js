'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'iflows');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const IflowSchema = new Schema({
        company_id: String,
        ns_contract_id: String, // 专门用来存储南山医院软件端的id
        ref_id: String,
        ref_app_id: String,
        app_id: String,
        show_id: String,
        title: String,
        user_id: String,
        open_id: String,
        other_sys_id: String,
        open_doctor_data_id: String, // 华西二院新在线问诊聚合提交数据ID
        open_doctor_iflow_type: String, // 华西二院新在线问诊聚合提交数据类型 expert:专家介绍, online_communication：在线问诊
        nickname: String,
        avatar: String,
        nickname_en: String,
        current_step_id: String,
        current_step_key: String,
        current_step_name: String,
        current_step_handlers: Array,
        current_step_type: String, // end 代表结束（locked锁定状态）
        current_step_timeout: String, // 当前步骤超时时间
    
        current_step_handlers_tpl: Array, // 临时保存顺序执行的人员
        approve_order: { type: Boolean, default: false }, // true表示流程节点人员审批顺序执行，false不顺序执行
        current_step_auto_time: String, // 自动处理时间
        current_step_approver_type: Number, // 当前节点的类型；1是固定处理人，17是固定处理人超时通过，18超时流转到下一个节点，19超时提醒
        current_step_timenotice: String, // 当前步骤超时时间
        current_step_noticed: Boolean, // 当前步骤超时已推送过
        check_timeout: Boolean, // 是否检查超时
        timeout_status: Number, // 审批超时状态  1 有人超时未处理 0 正常
        notice_handler: Boolean, // 超时是否给处理人推送消息
    
        already_handlers: Array,
        assist_handlers: Array, // 协助处理人（不阻碍流程，相当于评论）
        already_assist_handlers: Array, // 已处理
        curr_operator: Array,
        prev_user_step: String,
        curr_pos: String,
        curr_node: String,
        user_list: Array,
        signing_uids: Array,
        owner_uids: Array,
        confirm_uids: Array,
        done_uids: Array,
        comments_count: Number,
        status: Number,
        created: String,
        modified: String,
        inspector_id: String,
        follower: Object, // 老版的关注人
        followers: Object, // 新版的关注人
        deleted: Number, // 1 true 已删除，2 进入回收站
        is_cancel: { type: Boolean, default: false }, // 是否取消
        creator_uid: String,
        name: String,
        describe: String,
        excel_app: Object,
        type: String,
        subtype: String,
        operator_ids: Array,
        operator_group_ids: Array,
        manager_ids: Array,
        advisors: Array,
    
        print: { type: Boolean }, //是否已打印标识
        forward_user: Object, //被转发人数组   2019-07-01 新增  用于存放被转发人的id数组
        prev_user_step_nickname: Object, //上一步操作人名称   2019-08-02 新增  黄伟新增   仅供查询时使用
    }, {versionKey: false});

    return conn.model('iflows', IflowSchema);
};
