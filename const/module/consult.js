const DATA_TYPE_MAP = {
    "json": "json对象",
    "text": "text文本"
}

const CONDITION_TYPE_MAP = {
    //不会去判断该状态值的达成条件,一般只有初始默认值有这样的设置
    "none": "无判断",
    //存在关联该问诊单的数据, 如:
    //判断该问诊单的聊天数据大于等于3条
    //判断是否有未支付处方
    "hasDoc": "通过是否有数据判断",
    //某数据的某个key为指定值, 如:
    //判断该问诊单的医生有处方权
    //判断患者是否已绑定医保
    //判断审方是否通过
    "keyEval": "通过数据特征判断",
    //某数据的某个key存在且不为空,如:
    //判断该问诊单是否已绑定就诊卡
    "hasKey": "通过数据是否有key判断",
    //对某一组数据进行统计,比较统计结果判断,如:
    //判断单一咨询单所开医嘱总金额是否高于某值
    "statistic": "通过对关联数据统计结果判断",
    //从某个已定义好的api获取查询结果, 如:
    //从his系统查询药品库存
    "apiValidate": "通过接口返回判断"
};

const DOC_MAP = {
    "AppConfig":{
        name: "在线咨询应用",
        extras: [],
        populate: [
            {
                "path": "company_oid",
                "name": "医院信息"
            }
        ]
    },
    "Consult": {
        name: "咨询单",
        extras: [],
        populate: [
            {
                "path":"app_oid",
                "name": "在线问诊应用",
                "populate": [
                    {
                        "path": "company_oid",
                        "name": "医院信息"
                    }
                ]
            },
            {
                "path": "doctor_oid",
                "name": "医生",
                "populate": [
                    {
                        "path": "user_oid",
                        "name": "组织架构中用户id"
                    },
                    {
                        "path": "company_oid",
                        "name": "医院信息"
                    },
                    {
                        "path": "profile.group_oid",
                        "name": "科室"
                    }
                ]
            },
            {
                "path": "patient_oid",
                "name": "患者"
            },
            {
                "path": "record_oid",
                "name": "就诊记录",
                "populate": [
                    {
                        "path": "patient_oid",
                        "name": "患者"
                    }
                ]
            }
        ]
    },
    "ConsultMessage": {
        name: "聊天记录",
        extras: [
            {
                name: "医生发送",
                extra: {
                    "from": "doctor"
                }
            },
            {
                name: "患者发送",
                extra: {
                    "from": "patient"
                }
            },
            {
                name: "系统消息",
                extra: {
                    "from": "system"
                }
            },
            {
                name: "未撤回",
                extra: {
                    "isRetrieved": false
                }
            },
            {
                name: "已撤回",
                extra: {
                    "isRetrieved": true
                }
            },
            {
                name: "已删除",
                extra: {
                    "isDeleted": true
                }
            },
            {
                name: "未删除",
                extra: {
                    "isDeleted": false
                }
            }
        ],
        populate: [
            {
                "path": "consult_oid",
                "name": "咨询单",
                "populate": [
                    {
                        "path": "app_oid",
                        "name": "在线问诊应用",
                        "populate": [
                            {
                                "path": "company_oid",
                                "name": "医院信息"
                            }
                        ]
                    },
                    {
                        "path": "doctor_oid",
                        "name": "医生",
                        "populate": [
                            {
                                "path": "user_oid",
                                "name": "组织架构中用户id"
                            },
                            {
                                "path": "company_oid",
                                "name": "医院信息"
                            }
                        ]
                    },
                    {
                        "path": "patient_oid",
                        "name": "患者"
                    },
                    {
                        "path": "record_oid",
                        "name": "就诊记录",
                        "populate": [
                            {
                                "path": "patient_oid",
                                "name": "患者"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "ConsultAdvice": {
        name: "处方",
        extras: [
            {
                name: "未签名",
                extra: {
                    isSigned: false
                }
            },
            {
                name: "已签名",
                extra: {
                    isSigned: true
                }
            },
            {
                name: "未发送",
                extra: {
                    isSent: false
                }
            },
            {
                name: "已发送",
                extra: {
                    isSent: true
                }
            },
            {
                name: "未审方",
                extra: {
                    isAuthed: false
                }
            },
            {
                name: "已审方",
                extra: {
                    isAuthed: true
                }
            },
            {
                name: "未取消",
                extra: {
                    isCancelled: false
                }
            },
            {
                name: "已取消",
                extra: {
                    isCancelled: true
                }
            },
        ],
        populate: [
            {
                "path": "consult_oid",
                "name": "咨询单",
                "populate": [
                    {
                        "path": "app_oid",
                        "name": "在线问诊应用",
                        "populate": [
                            {
                                "path": "company_oid",
                                "name": "医院信息"
                            }
                        ]
                    },
                    {
                        "path": "doctor_oid",
                        "name": "医生",
                        "populate": [
                            {
                                "path": "user_oid",
                                "name": "组织架构中用户id"
                            },
                            {
                                "path": "company_oid",
                                "name": "医院信息"
                            },
                            {
                                "path": "profile.group_oid",
                                "name": "科室"
                            }
                        ]
                    },
                    {
                        "path": "patient_oid",
                        "name": "患者"
                    },
                    {
                        "path": "record_oid",
                        "name": "就诊记录",
                        "populate": [
                            {
                                "path": "patient_oid",
                                "name": "患者"
                            }
                        ]
                    }
                ]
            },
            {
                "path": "advices.medicine_oid",
                "name": "药品详情"
            },
            {
                "path": "advices.inspection_oid",
                "name": "检验检查详情"
            }
        ],
        keys:{
            "labs": {
                "name": "检验检查列表",
                "type": "Array",
                "itemType": "Object",
                keys:{
                    "inspection_oid":{
                        "name": "药品详情",
                        "type": "ObjectId",
                        "keys":{
                            "hisInspection": {
                                "name": "his检验检查代码"
                            }
                        }
                    },
                    "quantity": {
                        "name": "检验检查数量"
                    }
                }
            },
            "advices": {
                "name": "开药列表",
                "type": "Array",
                "itemType": "Object",
                keys:{
                    "medicine_oid":{
                        "name": "药品详情",
                        "type": "ObjectId",
                        "keys":{
                            "hisPlace": {
                                "name": "产地"
                            },
                            "hisMedicine": {
                                "name": "his药品代码"
                            }
                        }
                    },
                    "quantity": {
                        "name": "开药数量"
                    }
                }
            },
            "consult_oid": {
                "name": "咨询单详情",
                "type": "ObjectId",
                "keys": {
                    "doctor_oid": {
                        "name": "医生详情",
                        "type": "ObjectId",
                        "keys": {
                            "hisPower":{
                                "name": "his信息",
                                "type": "Object",
                                "keys":{

                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "ConsultDoctor": {
        name: "医生",
        extras: [
            {
                name: "可进行图文问诊",
                extra: {
                    "text.isOpen": true,
                    "text.isAvailable": true
                }
            },
            {
                name: "可进行视频问诊",
                extra: {
                    "video.isOpen": true,
                    "video.isAvailable": true
                }
            },
            {
                name: "可进行电话问诊",
                extra: {
                    "phone.isOpen": true,
                    "phone.isAvailable": true
                }
            },
            {
                name: "有开处方权",
                extra: {
                    "hisPower.canGiveAdvice": true
                }
            },
            {
                name: "有开检验权",
                extra: {
                    "hisPower.canGiveLab": true
                }
            },
            {
                name: "有开检查权",
                extra: {
                    "hisPower.canGivePicture": true
                }
            },
            {
                name: "有写处方权",
                extra: {
                    "hisPower.canGiveRecord": true
                }
            },
            {
                name: "CA认证通过",
                extra: {
                    "CA.state": "2"
                }
            }
        ],
        populate: [
            {
                "path": "user_oid",
                "name": "组织架构中用户id"
            },
            {
                "path": "company_oid",
                "name": "医院信息"
            },
            {
                "path": "profile.group_oid",
                "name": "科室"
            }
        ]
    },
    "ConsultRecord": {
        name: "就诊记录",
        extras: [
            {
                name: "已审核通过",
                extra: {
                    status: "authed"
                }
            }
        ],
        populate: [
            {
                "path":"patient_oid",
                "name": "患者"
            }
        ]
    },
    "ConsultDepartment":{
        name:"科室",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ],
    },
    "ConsultDiag":{
        name:"诊断",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ],
    },
    "ConsultDuration":{
        name:"药品疗程",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultForm":{
        name:"药品剂型",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultMedicine":{
        name:"药品",
        extras:[
            {
                name:"不在医保范围内",
                extra:{
                    "isInsurance":false
                }
            },
            {
                name:"在医保范围内",
                extra:{
                    "isInsurance":true
                }
            },
            {
                name:"不需要皮试",
                extra:{
                    "needSkinTest":false
                }
            },
            {
                name:"需要皮试",
                extra:{
                    "needSkinTest":true
                }
            },
            {
                name:"可用",
                extra:{
                    "disable":false
                }
            },
            {
                name:"不可用",
                extra:{
                    "disable":true
                }
            },
            {
                name:"不允许医生添加至医保",
                extra:{
                    "shouldDoctorPermitInsurance":false
                }
            },
            {
                name:"允许医生添加至医保",
                extra:{
                    "shouldDoctorPermitInsurance":true
                }
            }
        ],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultFreq":{
        name:"用药频率",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultInspection":{
        name:"检验检查",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultInstr":{
        name:"药品用法",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultPatient":{
        name:"患者",
        extras:[],
    },
    "ConsultRole":{
        name:"角色",
        extras:[
            {
                name:"日志管理权限模块",
                extra:{
                    "access":{
                        "$elementMatch":{
                            "module":"log-manage"
                        }
                    }
                }
            },
            {
                name:"模块-应用配置",
                extra:{
                    "access":{
                        "$elementMatch":{
                            "module":"config"
                        }
                    }
                }
            },
            {
                name:"权限-添加",
                extra:{
                    "access":{
                        "$elementMatch":{
                            "power":{
                                "$in":['create']
                            }
                        }
                    }
                }
            },
            {
                name:"权限-修改",
                extra:{
                    "access":{
                        "$elementMatch":{
                            "power":{
                                "$in":['modify']
                            }
                        }
                    }
                }
            },
            {
                name:"权限-删除",
                extra:{
                    "access":{
                        "$elementMatch":{
                            "power":{
                                "$in":['delete']
                            }
                        }
                    }
                }
            },
            {
                name:"权限-查看",
                extra:{
                    "access":{
                        "$elementMatch":{
                            "power":{
                                "$in":['view']
                            }
                        }
                    }
                }
            },
            {
                name:"非管理员",
                extra:{
                    "isAdmin":false
                }
            },
            {
                name:"是管理员",
                extra:{
                    "isAdmin":true
                }
            },
            {
                name:"非默认角色",
                extra:{
                    "defaultRole":false
                }
            },
            {
                name:"默认角色",
                extra:{
                    "defaultRole":true
                }
            }

        ]
    },
    "ConsultUom":{
        name:"药品计价",
        extras:[],
        populate:[
            {
                "path":"company_oid",
                "name":"医院"
            }
        ]
    },
    "ConsultUser":{
        name:"用户",
        extras:[],
        populate:[
            {
                "path":"role_oid",
                "name":"角色"
            },
            {
                "path":"scope_oid",
                "name":"用户权限"
            },
            {
                "path":"user_oid",
                "name":"用户"
            }
        ]
    },
    "ConsultUserScope":{
        name:"用户权限范围",
        extras:[],
        populate:[
            {
                "path":"user_oid",
                "name":"用户"
            },
            {
                "path":"scope",
                "name":"权限范围内的医院"
            }
        ]
    }
};

const KEYEVAL_ELEMENT_MAP = {
    "consult": "咨询单",
    "consultDoctor": "医生",
    "consultPatient": "患者",
    "consultRecord": "病历"
};

const ACTIONS_MAP = {
    createConsult: '创建问诊',
    closeConsult: '结束问诊',
    sendMessage: '发送消息',
    createRecord: '填写病历',
    authRecord: '审核病历',
    createAdvice: '填写医嘱',
    signAdvice: '医嘱签名',
    sendAdvice: '发送医嘱'
};

const AUTH_MODE_MAP = {
    token: "使用token进行api校验"
}

const API_METHOD_MAP = {
    POST: "post",
    GET: "get",
    DELETE: "delete",
    PUT: "put",
    HEAD: "head",
    PATCH: "patch",
    SOAP: "webService"
}

const API_RETURN_JUDGE_MAP = {
    eq: "等于",
    ne: "不等于",
    in: "包含",
    nin: "不包含",
    regex: "正则",
    lt: "小于",
    lte: "不大于",
    gt: "大于",
    gte: "不小于"
}

const STATISTIC_METHOD_MAP = {
    "SUM": "求和",
    "AVERAGE": "求平均",
    "MAX": "求最大值",
    "MIN": "求最小值",
    "AVEDEV": "求离散度",
    "WEIGHTEDSUM": "加权和"
}

const STATISTIC_COMPARE_OPERATOR_MAP = {
    "eq": "等于",
    "ne": "不等于",
    "lt": "小于",
    "lte": "小于等于",
    "gt": "大于",
    "gte": "大于等于",
    "between": "介于",
    "betweenLeft": "介于(包含左边界)",
    "betweenRight": "介于(包含右边界)",
    "betweenBoth": "介于(包含左右边界)"
}

const API_FORM_DATA_FROM_MAP = {
    "system": "系统方法",
    "result": "api请求结果/上级数据",
    "dataSource": "取数据结果",
    "preResult": "前置api请求结果",
    "customConfig": "公用参数",
    "value": "固定值",
    "params": "调用入参",
    "callbackUrl": "配置回调地址",
    "return": "现有配置数据"
}

const SOURCE_DATA_FORM_DATA_FROM_MAP = {
    "nest": "内嵌",
    "system": "系统方法",
    "customConfig": "公用参数",
    "value": "固定值",
    "params": "调用入参"
}

const SOURCE_EXTRA_OPERATION_MAP = {
    "value": "固定值",
    "params": "调用入参"
}

const SYSTEM_METHOD_MAP = {
    "dateFormat": "当前日期格式化(YYYY-MM-DD)",
    "dateFormatSecond": "当前日期格式化(YYYY-MM-DD HH:mm:ss)",
    "dateNow":"当前毫秒时间",
    "secondNow": "当前秒时间",
    "randomString":"随机32位字符串",
    "stringConcat":"字段字符串拼接",
    "mergeList":"对象列表合并",
    "filter":"对象列表过滤"
}

const SOURCE_DATA_SYSTEM_METHOD_MAP = {
    "dateFormat": "当前日期格式化(YYYY-MM-DD)",
    "dateFormatSecond": "当前日期格式化(YYYY-MM-DD HH:mm:ss)",
    "dateNow":"当前毫秒时间",
    "secondNow": "当前秒时间",
    "randomString":"随机32位字符串",
}

const HASH_METHOD_MAP = {
    "md5": "MD5",
    "sha1": "SHA1",
    "sha256": "SHA256",
    "hmac": "Hmac",
    "sm3": "国密SM3",
    "RSA-SHA1": "RSA1",
    "RSA-SHA256": "RSA2"
}

const ENCODE_MAP = {
    "hex": "hex",
    "base64": "base64",
    "ascii": "ascii",
    "utf-8": "utf-8",
    "byte": "二进制(buffer)"
}

const SIGNPOSITION_MAP = {
    "body": "Body",
    "query": "Query",
    "header": "Header",
    "param": "Param",
    "customConfig": "公用参数"
}

const SORTTYPE_MAP = {
    "keysort": "按照key的ascii码排序",
    "valuesort": "按照value的ascii码排序"
}

const PROTOCAL_MAP = {
    "http://": "http://",
    "https://": "https://"
}

const CONTENT_TYPE_MAP = {
    "application/json": "application/json",
    "multipart/form-data": "multipart/form-data",
    "application/x-www-form-urlencoded": "application/x-www-form-urlencoded",
    "text/plain": "text/plain",
    "application/soap+xml; charset=utf-8": "application/soap+xml; charset=utf-8"
}

const CONVERT_TEXT_MAP = {
    "xml": "解析xml",
    "json": "解析json字符串"
}

const DESENSITIZATION_MAP = {
    "phone": "手机号",
    "idCard": "身份证号",
    "passport": "护照号",
    "whole": "全部"
}

const CRYPTO_METHOD_MAP = {
    "aes-128-ecb": "AES-128-ECB",
    "aes-192-cbc": "AES-192-CBC",
    "wecom": "企业微信回调加解密",
    "sm4": "国密SM4",
    "RSA-SHA256": "RSA2",
    "RSA-SHA1": "RSA"
}

const CONVERT_DATA_TYPE_MAP = {
    "String": "字符串",
    "Number": "数字",
    "Boolean": "布尔值",
    "Array": "数组",
    "Object": "对象",
    "callbackUrl": "回调配置",
    "reducedArrayObject": "对象数组缩减",
    "arrayJoin": "数组拼接字符串",
    "stringSplit": "字符串拆分成数组",
    "getLength": "获取数组长度",
    "slice": "字符串截取",
    "encodeURIComponent": "encodeURIComponent",
    "encodeURI": "encodeURI",
    "decodeURIComponent": "decodeURIComponent",
    "decodeURI": "decodeURI"
}

module.exports = {
    CONDITION_TYPE_MAP,
    DOC_MAP,
    KEYEVAL_ELEMENT_MAP,
    ACTIONS_MAP,
    AUTH_MODE_MAP,
    API_METHOD_MAP,
    API_RETURN_JUDGE_MAP,
    STATISTIC_METHOD_MAP,
    STATISTIC_COMPARE_OPERATOR_MAP,
    API_FORM_DATA_FROM_MAP,
    SOURCE_DATA_FORM_DATA_FROM_MAP,
    SYSTEM_METHOD_MAP,
    SOURCE_DATA_SYSTEM_METHOD_MAP,
    HASH_METHOD_MAP,
    ENCODE_MAP,
    SIGNPOSITION_MAP,
    SORTTYPE_MAP,
    DATA_TYPE_MAP,
    PROTOCAL_MAP,
    CONTENT_TYPE_MAP,
    CONVERT_TEXT_MAP,
    DESENSITIZATION_MAP,
    CRYPTO_METHOD_MAP,
    CONVERT_DATA_TYPE_MAP,
    SOURCE_EXTRA_OPERATION_MAP
};
