
const DEFAULT_API_CONFIGS = require('./his/default');
const JINXIN_API_CONFIGS = require('./his/jinxin');
const TRUST_CA_CONFIGS =require('./ca/yiwangqian');
const BJCA_CA_CONFIGS  = require('./ca/bjca');
const ACTIONS_MAP = {
    createConsult: '新建咨询',
    closeConsult: '关闭咨询',
    sendDoctorMessage: '医生发送聊天消息',
    sendPatientMessage: '患者发送聊天消息',
    fillRecord: '填写病历',
    authRecord: '审核病历',
    createAdvice: '填写医嘱',
    signAdvice: '医嘱签名',
    sendAdvice: '发送医嘱'
}

const DEFAULT_MODULE_CONFIGS = [
    {
        "name": "咨询模块",
        "key": "consult",
        "actions":[
            {
                "name": "新建咨询",
                "key": "createConsult",
                "dependencies":[]
            },
            {
                "name": "医生发送聊天消息",
                "key": "sendDoctorMessage",
                "dependencies":[]
            },
            {
                "name": "患者发送聊天消息",
                "key": "sendPatientMessage",
                "dependencies":[
                    {
                        "statusName": "问诊状态",
                        "value": "咨询中",
                        "failStr": "ErrorNotOngoingConsult"
                    },
                    {
                        "statusName": "咨询单是否关闭",
                        "value": "否",
                        "failStr": "ErrorConsultClosed"
                    },
                    {
                        "statusName": "咨询单是否取消",
                        "value": "否",
                        "failStr": "ErrorConsultCanceled"
                    }
                ]
            },
            {
                "name": "关闭咨询",
                "key": "closeConsult",
                "dependencies":[
                    {
                        "statusName": "是否有效咨询",
                        "value": "是",
                        "failStr": "ErrorNotValidConsult"
                    },
                    {
                        "statusName": "咨询单是否关闭",
                        "value": "否",
                        "failStr": "ErrorConsultClosed"
                    },
                ]
            }
        ]
    },
    {
        "name": "病历模块",
        "key": "record",
        "actions": [
            {
                "name": "填写病历",
                "key": "fillRecord",
                "dependencies":[
                    {
                        "statusName": "病历是否已审核",
                        "value": "否",
                        "failStr": "ErrorRecordAlreadyAuthed"
                    }
                ]
            },
            {
                "name": "审核病历",
                "key": "authRecord",
                "dependencies":[]
            }
        ]
    },
    {
        "name": "药品处方模块",
        "key": "advice",
        "actions": [
            {
                "name": "手动同步药品目录",
                "key": "syncMedicine",
                "dependencies": []
            },
            {
                "name": "填写处方",
                "key": "createAdvice",
                "dependencies":[
                    {
                        "statusName": "医生是否有处方权",
                        "value": "是",
                        "failStr": "ErrorNoAdvicePower"
                    },
                    {
                        "statusName": "病历是否已审核",
                        "value": "是",
                        "failStr": "ErrorRecordNotAuthed"
                    }
                ]
            },
            {
                "name": "检查库存",
                "key": "checkStorage",
                "dependencies":[]
            },
            {
                "name": "对处方签名",
                "key": "signAdvice",
                "dependencies":[
                ]
            },
            {
                "name": "发送处方",
                "key": "sendAdvice",
                "dependencies":[
                    {
                        "statusName": "药品库存是否足够",
                        "value": "是",
                        "failStr": "ErrorNotEnoughStorage"
                    }
                ]
            }
        ]
    }
]

const DEFAULT_STATUS_CONFIGS = [
    {
        "name":"单次咨询处方金额是否超额",
        "values":[
            {
                "condition":{
                    "fetch":{
                        "fetch":{
                            "method":"WEIGHTEDSUM",
                            "path":[
                                "medicine_oid.hisUnitPrice",
                                "quantity"
                            ]
                        },
                        "path":"advices",
                        "method":"SUM"
                    },
                    "compare":{
                        "offset":{
                            "default":0,
                            "fromCtx":"request.body.advices",
                            "fetch":{
                                "path":[
                                    "price",
                                    "quantity"
                                ],
                                "method":"WEIGHTEDSUM"
                            }
                        },
                        "value":1000,
                        "operator":"lte"
                    },
                    "populate":[
                        "advices.medicine_oid"
                    ],
                    "conditionType":"statistic",
                    "targetModel":"ConsultAdvice"
                },
                "isDefault":false,
                "_id":"5eb4bcb64eedaf1f4c7b49b3",
                "value":"否"
            }
        ]
    },    
    {
        "name": "是否有效咨询",
        "values": [
            {
                "value": "否",
                "condition": {
                    "conditionType": "none"
                },
                "isDefault": true
            },
            {
                "value": "是",
                "condition": {
                    "conditionType": "hasDoc",
                    "targetModel": "ConsultMessage",
                    "extra": {
                        "from": "doctor",
                        "isRetrieved": false,
                        "isDeleted": false
                    },
                    "min": 3
                },
                "isDefault": false
            }
        ]
    },
    {
        "name": "问诊状态",
        "values": [
            {
                "value": "新咨询",
                "condition": {
                    "conditionType": "none"
                },
                "isDefault": true
            },
            {
                "value": "咨询中",
                "condition": {
                    "conditionType": "hasDoc",
                    "targetModel": "ConsultMessage",
                    "extra": {
                        "from": "doctor"
                    },
                    "min": 1
                },
                "isDefault": false
            }
        ]
    },
    {
        "name": "咨询单是否关闭",
        "values": [
            {
                "value": "否",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consult",
                    "elementKey": "isClosed",
                    "elementEval": false
                }
            },
            {
                "value": "是",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consult",
                    "elementKey": "isClosed",
                    "elementEval": true
                }
            }
        ]
    },
    {
        "name": "咨询单是否取消",
        "values": [
            {
                "value": "否",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consult",
                    "elementKey": "isCanceled",
                    "elementEval": false
                }
            },
            {
                "value": "是",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consult",
                    "elementKey": "isCanceled",
                    "elementEval": true
                }
            }
        ]
    },
    {
        "name": "病历是否已审核",
        "values": [
            {
                "value": "否",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consult",
                    "elementKey": "recordAuthed",
                    "elementEval": false
                },
                "isDefault": true
            },
            {
                "value": "是",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consult",
                    "elementKey": "recordAuthed",
                    "elementEval": true
                },
                "isDefault": false
            }
        ]
    },
    {
        "name": "医生是否有处方权",
        "values": [
            {
                "value": "否",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consultDoctor",
                    "elementKey": "hisPower.canGiveAdvice",
                    "elementEval": false
                },
                "isDefault": true
            },
            {
                "value": "是",
                "condition": {
                    "conditionType": "keyEval",
                    "targetElement": "consultDoctor",
                    "elementKey": "hisPower.canGiveAdvice",
                    "elementEval": true
                },
                "isDefault": false
            }
        ]
    },
    {
        "name": "药品库存是否足够",
        "values": [
            {
                "value": "是",
                "condition": {
                    "conditionType": "apiValidate",
                    "service": "查询库存"
                }
            }
        ]
    }
]

const API_CONFIGS = {
    'DEFAULT':DEFAULT_API_CONFIGS,
    'JINXIN':JINXIN_API_CONFIGS,
}

const CA_CONFIGS = {
     'DEFAULT':[],
     'YIWANGQIAN':TRUST_CA_CONFIGS,
     'BJCA':BJCA_CA_CONFIGS
}

module.exports = {
    ACTIONS_MAP,
    DEFAULT_MODULE_CONFIGS,
    DEFAULT_STATUS_CONFIGS,
    API_CONFIGS,
    CA_CONFIGS
}