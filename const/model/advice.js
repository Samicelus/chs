const SEND_STATE_MAP = {                      //就诊记录审核状态
    "wait": "未发送",
    "sent": "已发送"
}

const DIAGNOSIS_TYPE_MAP = {                    //诊断类型
    "first": "初诊",
    "further": "复诊",
    "surgery": "术后复诊"
} 

module.exports = {
    SEND_STATE_MAP,
    DIAGNOSIS_TYPE_MAP
}