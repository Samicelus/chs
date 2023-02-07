const URL_Test = 'http://test.51trust.com';
const URL_Pro = 'https://www.51trust.com';
const URL = URL_Pro;
const YIWANGQIAN_CA_CONFIGS = [
    {
        "name": "获取token",
        "url": `${URL}/device/server/oauth/getAccessToken`,
        "pre": {
            "hasPre": false
        },
        "method": "GET",
        "cache": {
            "isCached": true,
            "cacheKey": "token",
            "renewed": true,
            "cacheTime": {
                "byReturn": false,
                "default": 4 * 60 * 60
            }
        },
        "dataMerge": {
            "clientId": {
                "from": "customConfig",
                "path": "clientId",
                "source": "",
                "required": false
            },
            "appSecret": {
                "from": "customConfig",
                "path": "appSecret",
                "source": ""
            }
        },
        "return": {
            "token": {
                "from": "result",
                "path": "data.accessToken",
                "source": "",
                "convert": {
                    "type": "String",
                    "default": "",
                    "enum": []
                }
            }
        }
    },
    {
        "name": "同步医师信息接口",
        "url": `${URL}/am/doctor/syn`,
        "pre": {
            "hasPre": true,
            "processReturn": {},
            "apiName": "获取token"
        },
        "method": "POST",
        "dataType": "json",
        "cache": {
            "isCached": true,
            "cacheKey": "token",
            "renewed": true,
            "cacheTime": {
                "byReturn": false,
                "default": 4 * 60 * 60
            }
        },
        "data": {
            "body": {
                "doctorId": "511111199304015516",
                "doctorIdType": "QT",
                "orgName": "成都西囡妇科医院",
                "doctorName": "徐凯",
                "uid": "511111199304015516",
                "uidCardType": "SF",
                "phone": "18408251285",
                "department": "测试",
                "title": "测试"
            }
        },
        "dataMerge": {
            "head_accessToken": {
                "from": "preResult",
                "path": "token",
                "key": "head.accessToken",
                "value": "100"
            },
            "head_serviceId": {
                "from": "value",
                "path": "100",
                "key": "head.serviceId",
                "value": "100"
            },
            "head_clientId": {
                "from": "customConfig",
                "path": "clientId",
                "key": "head.clientId"
            }
        },
        "return": {
            "openId": {
                "from": "result",
                "path": "data.openId",
                "source": ""
            },
            "token": {
                "from": "preResult",
                "path": "token",
                "source": ""
            }
        },
    },
    {
        "name": "同步签名数据信息接口",
        "url": `${URL}/am/recipe/syn`,
        "pre": {
            "hasPre": true,
            "processReturn": {},
            "apiName": "同步医师信息接口"
        },
        "method": "POST",
        "dataMerge": {
            "signType": {
                "from": "value",
                "path": "signType",
                "source": "",
                "value": "1"
            },
            "msg_head_serviceId": {
                "from": "value",
                "path": "msg.head.serviceId",
                "key": "msg.head.serviceId",
                "value": "101"
            },
            "msg_head_templateId": {
                "from": "value",
                "path": "msg.head.templateId",
                "key": "msg.head.templateId",
                "value": "recipe"
            },
            "msg_head_accessToken": {
                "from": "preResult",
                "path": "token",
                "key": "msg.head.accessToken"
            },
            "msg_body_openId": {
                "from": "preResult",
                "path": "openId",
                "key": "msg.body.openId"
            },
            "msg_body_recipeTime": {
                "from": "system",
                "path": "msg.body.recipeTime",
                "key": "msg.body.recipeTime",
                "method": "dateFormat"
            },
            "msg_head_clientId": {
                "from": "result",
                "path": "clientId",
                "key": "msg.head.clientId"
            }
        },
        "cache": {
            "isCached": true,
            "cacheKey": "token",
            "renewed": true,
            "cacheTime": {
                "byReturn": false,
                "default": 4 * 60 * 60
            }
        },
        "dataType": "json",
        "data": {
            "msg": {
                "head": {
                    "clientId": "2015112716143758"
                },
                "body": {
                    "pathogeny": "感冒",
                    "diagnose": "感冒发烧",
                    "urId": "2343d6",
                    "patientName": "测试患者",
                    "patientAge": "23",
                    "patientSex": "男",
                    "patientCard": "510103198704220518",
                    "patientCardType": "SF",
                    "recipeTime": "2020-06-15 14:12:49",
                    "recipeInfo": [
                        {
                            "Quantity": "2",
                            "standard": "20",
                            "Price": "15",
                            "name": "感冒灵",
                            "Days": "7",
                            "Dosage": "3",
                            "UnitOf": "mg",
                            "Frequency": "每日三次",
                            "Unit": "盒",
                            "Usage": "口服"
                        }
                    ]
                }
            }
        },
        "return": {
            "openId": {
                "from": "result",
                "path": "data.openId",
                "source": ""
            },
            "token": {
                "from": "preResult",
                "path": "token",
                "source": ""
            }
        },
    },
    {
        "name": "获取签名状态",
        "url": `${URL}/am/recipe/verify/signedStamp`,
        "pre": {
            "hasPre": true,
            "processReturn": {},
            "apiName": "同步医师信息接口"
        },
        "method": "POST",
        "cache": {
            "isCached": true,
            "cacheKey": "token",
            "renewed": true,
            "cacheTime": {
                "byReturn": false,
                "default": 4 * 60 * 60
            }
        },
        "data": {
            "signType": "1",
            "msg": {
                "head": {
                    "templateId": "recipe"
                },
                "body": {
                    "signedStamp": "03ab27f41de42e4bq6494wc3e6y82cb43cc",
                    "openId": "03ab27f41de42e4bq6494wc3e6y82cb43cc"
                }
            }
        },
        "dataMerge": {
            "msg_head_serviceId": {
                "from": "value",
                "path": "100",
                "key": "msg.head.serviceId",
                "value": "100"
            },
            "msg_head_clientId": {
                "from": "customConfig",
                "path": "clientId",
                "key": "msg.head.clientId"
            },
            "msg_head_accessToken": {
                "from": "preResult",
                "path": "token",
                "key": "msg.head.accessToken"
            },
            "msg_head_templateId": {
                "from": "value",
                "path": "msg.head.templateId",
                "key": "msg.head.templateId",
                "value": "recipe"
            },
            "msg_body_openId": {
                "from": "preResult",
                "path": "openId",
                "key": "msg.body.openId"
            }
        },
        "return": {

        }
    },
]
module.exports = YIWANGQIAN_CA_CONFIGS;