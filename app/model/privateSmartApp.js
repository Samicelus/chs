'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'privateSmartapps');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const SmartAppSchema = new Schema({
        show_id: String,
        creator_uid: String,
        company_id: String,
        type: Number, // meeting:6, duty_log:7, shouwen:6, schedule:9, online_question:11, cms: 12
        subtype: String, // meeting:会议室预定, duty_log:排班日志, shouwen: 收文, schedule: 排版, online_question: 在线咨询, cms: CMS
        name: String,
        icon_url: String,
        app_url: String,
        icon_font_content: String,
        created: String,
        modified: String,
        manager_ids: Array,
        default_follower: Array, // 关注人
        operator_group_ids: Array, // 应用可见返回
        operator_label_ids: Array,
        operator_ids: Array,
        un_operator_group_ids: Array, // 应用不可见返回
        un_operator_label_ids: Array,
        un_operator_ids: Array,
        coadjutant_options: Boolean, // 协处理人开关
        visible4children: Boolean,
        visible4children4label: Boolean,
        visible_label_ids: Array,
        describe: String,
        authority_type: Number,
        authority_follower: Number, // 是否开启关注人
        flow_diagram: Object,
        excel_app: Object,
        notice_tpl: String, // 标题产生模板
        appGroup: Object, // {AppGroupId:"", order:0}
        sort: String,
        schedule_notes: String, // 排版应用备注
        appGroupId: String, // 临时使用
        appGroupEnabled: Boolean, // 临时使用
        appGroupName: String, // 临时使用
        weixinqy: Object,
        extraShiftConfig: Object, // 加班申请应用的设置
        needExamine: String, //cms是否需要审批
        wxPages: Object, // 微信手机端页面配置
        extraOptions: {
            type: Object,
            default: {
                email: { public_open: 1 },  // 邮件1.1 @lkkchen 增加配置 默认开启公共邮箱   { email: { public_open: 1 //0 } }
                timeout: { // 超时提醒
                    state: false, // 是否开启超时提醒
                    notice: true, // 是否开启超时提醒
                    roles: ['handler'], // 提醒人
                    time: 0, // 处理时长
                    unified: false, // 是否所有节点统一时长
                },
            }
        },
        available_time: String,
        available_days: Number,
        apply_ids: Array,     //可发起人
        is_ctrip: Boolean,
    }, {versionKey: false});

    return conn.model('private_smartapps', SmartAppSchema);
};
