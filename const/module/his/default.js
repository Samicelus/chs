const DEFAULT_API_CONFIGS = [
    {
        "name": "获取token",
        "url": "http://localhost:7001/v1/private/user/login",
        "pre": {
            "hasPre": false
        },
        "method": "POST",
        "data": {
            "login": "admin",
            "password": "admin"
        },
        "cache": {
            "isCached": true,
            "cacheKey": "token",
            "renewed": true,
            "cacheTime": {
                "byReturn": false,
                "default": 24 * 60 * 60
            }
        },
        "return": {
            "token": {
                "path": "token"
            }
        }
    },
    {
        "name": "同步药品目录",
        "url": "http://localhost:7001/v1/fake/medicine/sync",
        "pre": {
            "hasPre": true,
            "apiName": "获取token",
            "processReturn":{
                "token":{
                    "header":{
                        "name": "b-json-web-token"
                    }
                }
            }
        },
        "method": "GET",
        "cache": {
            "isCached": false,
        },
        "return": {
            "list": {
                "from": "result",
                "path": "data",
                "convert": {
                    "type": "Array",
                    "itemType": "Object",
                    "return": {
                        "type": {
                            "from": "result",
                            "path": "type"
                        },
                        "branchCode": {
                            "from": "result",
                            "path": "branchCode"
                        },
                        "hisMedicine": {
                            "from": "result",
                            "path": "arcCode"
                        },
                        "hisMedicineDesc": {
                            "from": "result",
                            "path": "arcDesc"
                        },
                        "hisMedicineAlias": {
                            "from": "result",
                            "path": "arcAlias"
                        },
                        "hisSpecDesc": {
                            "from": "result",
                            "path": "arcSpec"
                        },
                        "hisUom": {
                            "from": "result",
                            "path": "arcUom.arcUom"
                        },
                        "hisDosageUom": {
                            "from": "result",
                            "path": "arcDosageUom[0].arcUom"
                        },
                        "hisUnitPrice":{
                            "from": "result",
                            "path": "arcUnitPrice"
                        }
                    }
                }
            }
        }
    },
    {
        "name": "查询单个药品库存",
        "url": "http://localhost:7001/v1/fake/onlineinquiry/queryStockByDrugCode",
        "pre": {
            "hasPre": true,
            "apiName": "获取token",
            "processReturn":{
                "token":{
                    "header":{
                        "name": "b-json-web-token"
                    }
                }
            }
        },
        "method": "GET",
        "cache": {
            "isCached": false,
        },
        "return": {
            "result": {
                "path": "data",
                "convert": {
                    "type": "Boolean",
                    "default": true,
                    "enum": [
                        {
                            "value": false,
                            "condition": {
                                "eq": 0
                            }
                        }
                    ]
                }
            }
        }
    },
    {
        "name": "查询库存",
        "url": "http://localhost:7001/v1/fake/medicine/check",
        "pre": {
            "hasPre": true,
            "apiName": "获取token",
            "processReturn":{
                "token":{
                    "header":{
                        "name": "b-json-web-token"
                    }
                }
            }
        },
        "method": "GET",
        "data":{
            "itemList":{
                "itemInfo":[]
            }
        },
        "dataSource": [{
            "sourceName": "处方数据",
            "targetModel": "ConsultAdvice",
            "populate": ["advices.medicine_oid"]
        }],
        "dataMerge": {
            "content":{
                "key":"itemList.itemInfo",
                "from":"dataSource",
                "source": "consultAdvice",
                "path":"advices",
                "convert":{
                    "type":"Array",
                    "itemType":"Object",
                    "return":{
                        "ArcCode":{
                            "from":"result",
                            "path":"medicine_oid.hisMedicine"
                        },
                        "ArcQty":{
                            "from":"result",
                            "path":"quantity"
                        },
                        "ArcUom":{
                            "from":"result",
                            "path":"unit"
                        }
                    }
                }
            }
        },
        "cache": {
            "isCached": false,
        },
        "return": {
            "result": {
                "path": "data",
                "convert": {
                    "type": "Boolean",
                    "default": true,
                    "enum": [
                        {
                            "value": false,
                            "condition": {
                                "eq": "0"
                            }
                        }
                    ]
                }
            }
        }
    },
    {
        "name": "向his写入处方",
        "url": "http://localhost:7001/v1/fake/advice/his",
        "pre": {
            "hasPre": true,
            "apiName": "获取token",
            "processReturn":{
                "token":{
                    "header":{
                        "name": "b-json-web-token"
                    }
                }
            }
        },
        "method": "POST",
        "cache": {
            "isCached": false
        },
        "dataSource": [
            {
                "sourceName": "处方数据",
                "targetModel": "ConsultAdvice",
                "populate": ["consult_oid doctor_oid", "advices.medicine_oid"]
            }
        ],
        "dataMerge":{
            "branchCode": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "advices[0].medicine_oid.branchCode"
            },
            "docCode": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "consult_oid.doctor_oid.hisPower.hisId"
            },
            "cardNo": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "consult_oid.usedCard"
            },
            "diagnose": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "diagnosis"
            },
            "diagnoseFlag": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "diagnosisType",
                "convert": {
                    "type": "String",
                    "default": "0",
                    "enum": [
                        {
                            "value": "0",
                            "condition": {
                                "eq": "first"
                            }
                        },
                        {
                            "value": "1",
                            "condition": {
                                "eq": "further"
                            }
                        },
                        {
                            "value": "2",
                            "condition": {
                                "eq": "surgery"
                            }
                        }
                    ]
                }
            },
            "docCode": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "consult_oid.doctor_oid.hisPower.hisId"
            },
            "gfpId": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "consult_oid.doctor_oid.profile.group_oid"
            },
            "jzDate": {
                "from": "system",
                "method": "dateFormat"
            },
            "opcRegId": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "consult_oid.admId"
            },
            "orderItem": {
                "from": "dataSource",
                "source": "consultAdvice",
                "path": "advices",
                "convert":{
                    "type": "Array",
                    "itemType": "Object",
                    "return": {
                        "orderPlaceCode": {
                            "from": "result",
                            "path": "medicine_oid.hisPlace"
                        },
                        "orderARCIMRowid": {
                            "from": "result",
                            "path": "medicine_oid.hisMedicine"
                        },
                        "orderPackQty": {
                            "from": "result",
                            "path": "quantity"
                        },
                        "orderPrice": {
                            "from": "result",
                            "path": "medicine_oid.hisUnitPrice"
                        },
                        "orderDrugFormRowid": {
                            "from": "result",
                            "path": "medicine_oid.hisForm"
                        },
                        "orderDepProcNotes": {
                            "from": "result",
                            "path": "notes"
                        },
                        "orderDoseQty": {
                            "from": "result",
                            "path": "dosage"
                        },
                        "orderDoseUOMRowid": {
                            "from": "result",
                            "path": "dosageUnit"
                        },
                        "orderFreqRowid": {
                            "from": "result",
                            "path": "frequency"
                        },
                        "orderDurRowid": {
                            "from": "result",
                            "path": "duration"
                        },
                        "orderInstrRowid": {
                            "from": "result",
                            "path": "method"
                        }
                    }
                }
            }
        },
        "return": {
            
        }
    },
    {
        "name": "获取access_token",
        "url": "https://qyapi.weixin.qq.com/cgi-bin/gettoken",
        "pre": {
            "hasPre": false
        },
        "method": "GET",
        "data": {},
        "dataSource": [
            {
                "sourceName": "在线咨询应用数据",
                "targetModel": "AppConfig",
                "populate": ["company_oid"]
            }
        ],
        "dataMerge":{
            "corpid": {
                "from": "dataSource",
                "source": "appConfig",
                "path": "company_oid.weixinqy.corpId"
            },
            "corpsecret": {
                "from": "dataSource",
                "source": "appConfig",
                "path": "qywechat.secret"
            }
        },
        "cache": {
            "isCached": true,
            "cacheKey": "access_token",
            "renewed": true,
            "cacheTime": {
                "byReturn": false,
                "default": 2 * 60 * 60 - 200
            }
        },
        "return": {
            "token": {
                "path": "access_token"
            }
        }
    },
    {
        "name": "获取jsapi_ticket",
        "url": "https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket",
        "pre": {
            "hasPre": true,
            "apiName": "获取access_token",
            "processReturn": {
                "token": {
                "query": {
                        "name": "access_token"
                    }
                }
            }
        },
        "method": "GET",
        "data": {},
        "dataSource": [],
        "dataMerge": {},
        "cache": {
            "cacheTime": {
                "byReturn": false,
                "default": 7000
            },
            "isCached": true,
            "renew": true,
            "cacheKey": "ticket"
        },
        "return": {
            "ticket": {
                "path": "ticket"
            }
        },
    },
    {
        "name": "向医生发送消息",
        "url": "https://qyapi.weixin.qq.com/cgi-bin/message/send",
        "pre": {
            "hasPre": true,
            "apiName": "获取access_token",
            "processReturn":{
                "token":{
                    "query":{
                        "name": "access_token"
                    }
                }
            }
        },
        "method": "POST",
        "cache": {
            "isCached": false
        },
        "data": {
            "msgtype": "news",
            "news" : {
                "articles" : [
                    {
                        "title" : "在线咨询新消息",
                        "url": "http://mp.weixin.qq.com",
                        "picurl" : "http://res.mail.qq.com/node/ww/wwopenmng/images/independent/doc/test_pic_msg1.png"
                    }
                 ]
            },
        },
        "dataSource": [
            {
                "sourceName": "消息数据",
                "targetModel": "ConsultMessage",
                "populate": ["consult_oid app_oid", "consult_oid doctor_oid"]
            }
        ],
        "dataMerge":{
            "touser": {
                "from": "dataSource",
                "source": "consultMessage",
                "path": "consult_oid.doctor_oid.user_oid"
            },
            "agentid": {
                "from": "dataSource",
                "source": "consultMessage",
                "path": "consult_oid.app_oid.qywechat.agentid"
            },
            "content": {
                "from": "dataSource",
                "source": "consultMessage",
                "path": "content",
                "key": "news.articles[0].description"
            }
        },
        "return": {
        }
    }
]
module.exports = DEFAULT_API_CONFIGS;