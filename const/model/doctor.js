const DOCTOR_PROPERTY_MAP = {               //在线问诊医生属性
    "doctor": "医生",
    "nurse": "护士",
    "technician": "技师"
}

const TEXT_PUSH_TYPE_MAP = {                //图文文章推送方式
    "immediate": "即时",
    "halfHour": "每半小时",
    "oneHour": "每小时",
    "oneDay": "每天"
}

const CA_STATE_MAP = {                      //CA认证状态码
    "-1": "未进行认证",
    "0": "身份审核通过, 请下载医网签app并在app内下载证书",
    "1": "证书已签发，请在医网签app内设置签章",
    "2": "签章已设置，CA认证流程已完成",
    "3": "未知状态",
    "4": "申请已拒绝，请前往设置并重新提交"
}

module.exports = {
    DOCTOR_PROPERTY_MAP,
    TEXT_PUSH_TYPE_MAP,
    CA_STATE_MAP
}