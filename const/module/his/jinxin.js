const URL_Test = 'http://118.122.93.13:8766/api';
const URL_Pro = 'http://service.cd.jinxin-fertility.com:8095/api';
const URL = URL_Test;
const JINXIN_API_CONFIGS = [
    {
    "name": "获取token",
    "url": `${URL}/auth/jwt/token`,
    "pre": {
        "hasPre": false
    },
    "method": "POST",
    "data": {
        "login": "emt",
        "password": "7e024f06119f32a5d102c8b7e9801a1f"
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
    "return": {
        "token": {
            "path": "data"
        }
    }
 },
 {
    "name": "获取诊断类型，初诊或复诊",
    "url":  `${URL}/zxwz/onlineinquiry/queryPatientIsSecondVisit`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn": {
            "token": {
                "header": {
                    "name": "Authorization"
                }
            }
        }
    },
    "cache": {
        "isCached": false,
    },
    "method": "POST",
    "dataType": "json",
    "data": {
        "admId": "0099999998"
    },
    "return": {
        "result": {
            "path": "data",
            "convert": {
                "type": "Number",
                "default": "初诊",
                "enum": [
                    {
                        "value": "复诊",
                        "condition": {
                            "eq": 1
                        }
                    },
                    {
                        "value": "初诊",
                        "condition": {
                            "eq": 2
                        }
                    }
                ]
            }
        }
    }
},
 {
    "name": "向his写入检验检查订单",
    "url": `${URL}/zxwz/onlineinquiry/submitDiagOrders`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "dataSource": [
        {
            "sourceName": "处方数据",
            "targetModel": "ConsultAdvice",
            "populate": [
                "consult_oid doctor_oid",
                "advices.inspection_oid"
            ],
            "addPopulation": false
        }
    ],
    "dataMerge": {
        "cardNo": {
            "from": "dataSource",
            "path": "consult_oid.usedCard",
            "source": "consultAdvice"
        },
        "diagnose": {
            "from": "dataSource",
            "path": "diagnosis",
            "source": "consultAdvice"
        },
        "diagnoseFlag": {
            "from": "dataSource",
            "path": "diagnosisType",
            "source": "consultAdvice"
        },
        "docCode": {
            "from": "dataSource",
            "path": "consult_oid.doctor_oid.hisPower.hisId",
            "source": "consultAdvice"
        },
        "gfpId": {
            "from": "customConfig",
            "path": "consult_oid.doctor_oid.profile.group_oid",
            "source": ""
        },
        "opcRegId": {
            "from": "dataSource",
            "path": "consult_oid.admId",
            "source": "consultAdvice"
        },
        "orderNo": {
            "from": "dataSource",
            "path": "hisId",
            "source": "consultAdvice"
        },
        "orderItem": {
            "from": "dataSource",
            "path": "labs",
            "source": "consultAdvice",
            "convert": {
                "type": "Array",
                "default": "",
                "enum": [],
                "itemType": "Object",
                "return": {
                    "orderARCIMRowid": {
                        "from": "result",
                        "path": "inspection_oid",
                        "source": "consultAdvice"
                    },
                    "orderPackQty": {
                        "from": "result",
                        "path": "quantity",
                        "source": "consultAdvice"
                    }
                }
            }
        }
    },
    "dataType": "json",
    "cache": {
        "isCached": false,
    },
    "return": {
    }
 },
 {
    "name": "向his写入药品订单",
    "url": `${URL}/zxwz/onlineinquiry/submitDiagOrders`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "dataSource": [
        {
            "sourceName": "处方数据",
            "targetModel": "ConsultAdvice",
            "populate": [
                "consult_oid doctor_oid",
                "advices.medicine_oid"
            ],
            "addPopulation": false
        }
    ],
    "dataType": "json",
    "dataMerge": {
        "branchCode": {
            "from": "dataSource",
            "path": "advices[0].medicine_oid.branchCode",
            "source": "consultAdvice"
        },
        "cardNo": {
            "from": "dataSource",
            "path": "consult_oid.usedCard",
            "source": "consultAdvice"
        },
        "diagnose": {
            "from": "dataSource",
            "path": "diagnosis",
            "source": "consultAdvice"
        },
        "diagnoseFlag": {
            "from": "dataSource",
            "path": "diagnosisType",
            "source": "consultAdvice"
        },
        "docCode": {
            "from": "dataSource",
            "path": "consult_oid.consultComment_oid.doctor_oid.hisPower.hisId",
            "source": "consultAdvice"
        },
        "gfpId": {
            "from": "dataSource",
            "path": "consult_oid.doctor_oid.profile.department_oid",
            "source": "consultAdvice"
        },
        "jzDate": {
            "from": "system",
            "path": "jzDate",
            "source": "",
            "method": "dateFormat"
        },
        "opcRegId": {
            "from": "dataSource",
            "path": "consult_oid.admId",
            "source": "consultAdvice"
        },
        "orderItem": {
            "from": "dataSource",
            "path": "advices",
            "source": "consultAdvice",
            "convert": {
                "type": "Array",
                "default": "",
                "enum": [],
                "itemType": "Object",
                "return": {
                    "duration": {
                        "from": "dataSource",
                        "path": "duration",
                        "source": "consultAdvice"
                    },
                    "orderARCIMRowid": {
                        "from": "dataSource",
                        "path": "medicine_oid",
                        "source": "consultAdvice"
                    },
                    "orderDoseQty": {
                        "from": "dataSource",
                        "path": "dosage",
                        "source": "consultAdvice"
                    },
                    "orderDoseUOMRowid": {
                        "from": "dataSource",
                        "path": "dosageUnit",
                        "source": "consultAdvice"
                    },
                    "orderFreqRowid": {
                        "from": "dataSource",
                        "path": "frequency",
                        "source": "consultAdvice"
                    },
                    "orderInstrRowid": {
                        "from": "dataSource",
                        "path": "method",
                        "source": "consultAdvice"
                    },
                    "orderPackQty": {
                        "from": "dataSource",
                        "path": "quantity",
                        "source": "consultAdvice"
                    },
                    "orderPlaceCode": {
                        "from": "dataSource",
                        "path": "medicine_oid.hisPlace",
                        "source": "consultAdvice"
                    },
                    "orderPrice": {
                        "from": "dataSource",
                        "path": "price",
                        "source": "consultAdvice"
                    },
                    "takDrugUnit": {
                        "from": "dataSource",
                        "path": "unit",
                        "source": "consultAdvice"
                    }
                }
            }
        }
    },
    "cache": {
        "isCached": false,
    },
    "return": {

    }, 
 },
 {
    "name": "取消检验检查订单",
    "url": `${URL}/zxwz/onlineinquiry/cancelDiagOrders`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "data": {
        "docCode": "000",
        "gfpId": "8386f3c400b880816a50",
        "opcRegId": "0ci3w59ew4udcb7i",
        "orderNo": "xxx1222",
        "cancelType": "2"
    },
    "dataType": "json",
    "cache": {
        "isCached": false,
    },
    "return": {
        "data": {
            "from": "result",
            "path": "resultCode",
        }
    }
 },
 {
    "name": "取消药品订单",
    "url": `${URL}/zxwz/onlineinquiry/cancelDrugOrders`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "dataType": "json",
    "data": {
        "docCode": "000",
        "gfpId": "8386f3c400b880816a50",
        "opcRegId": "0ci3w59ew4udcb7i",
        "orderNo": "xxx1222",
        "cancelType": "1"
    },
    "cache": {
        "isCached": false,
    },
    "return": {
        "data": {
            "from": "result",
            "path": "resultCode",
        }
    }
 },
 {
    "name": "同步药品订单",
    "url": `${URL}/zxwz/onlineinquiry/syncDrugData`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
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
                    "hisPlace": {
                        "from": "result",
                        "path": "arcPlaceCode",
                        "source": ""
                    },
                    "hisMedicine": {
                        "from": "result",
                        "path": "arcCode",
                        "source": ""
                    },
                    "hisMedicineDesc": {
                        "from": "result",
                        "path": "arcDesc",
                        "source": ""
                    },
                    "hisMedicineAlias": {
                        "from": "result",
                        "path": "arcAlias",
                        "source": ""
                    },
                    "hisSpecDesc": {
                        "from": "result",
                        "path": "arcSpec",
                        "source": ""
                    },
                    "hisUnitPrice": {
                        "from": "result",
                        "path": "arcUnitPrice",
                        "source": ""
                    },
                    "hisUom": {
                        "from": "result",
                        "path": "arcUom.arcUom",
                        "source": ""
                    },
                    "hisManfDesc": {
                        "from": "result",
                        "path": "arcManf",
                        "source": ""
                    },
                    "hisForm": {
                        "from": "result",
                        "path": "arcForm.arcForm",
                        "source": ""
                    },
                    "hisFormDesc": {
                        "from": "result",
                        "path": "arcForm.arcForm_Desc",
                        "source": ""
                    },
                    "hisDosageNum": {
                        "from": "result",
                        "path": "arcDosage",
                        "source": ""
                    },
                    "hisDosageUom": {
                        "from": "result",
                        "path": "arcDosageUom.arcUom",
                        "source": ""
                    },
                    "hisDuration": {
                        "from": "result",
                        "path": "arcDuration.arcDuration",
                        "source": ""
                    },
                    "isInsurance": {
                        "from": "result",
                        "path": "isInsurance",
                        "source": ""
                    }
                }
            }
        }
    },
 },
 {
    "name": "同步检验检查订单",
    "url": `${URL}/zxwz/onlineinquiry/syncDiagData`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "cache": {
        "isCached": false,
    },
    "return": {
        "list": {
            "from": "result",
            "path": "data",
            "source": "",
            "convert": {
                "type": "Array",
                "default": "",
                "enum": [],
                "itemType": "Object",
                "return": {
                    "hisPlace": {
                        "from": "result",
                        "path": "arcCode",
                        "source": ""
                    },
                    "hisInspection": {
                        "from": "result",
                        "path": "arcDesc",
                        "source": ""
                    },
                    "hisInspectionDesc": {
                        "from": "result",
                        "path": "hisInspectionDesc",
                        "source": ""
                    },
                    "hisInspectionAlias": {
                        "from": "result",
                        "path": "arcAlias",
                        "source": ""
                    },
                    "hisUnitPrice": {
                        "from": "result",
                        "path": "arcUnitPrice",
                        "source": ""
                    },
                    "hisUom": {
                        "from": "result",
                        "path": "arcAlias",
                        "source": ""
                    },
                    "hisType": {
                        "from": "result",
                        "path": "arcTypeCode",
                        "source": ""
                    },
                    "hisTypeDesc": {
                        "from": "result",
                        "path": "arcTypeDesc",
                        "source": ""
                    },
                    "item": {
                        "from": "result",
                        "path": "item",
                        "source": ""
                    },
                    "type": {
                        "from": "result",
                        "path": "type",
                        "source": ""
                    }
                }
            }
        }
    }
 },
 {
    "name": "同步药品剂型",
    "url": `${URL}/zxwz/onlineinquiry/syncArcFormData`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
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
                    "hisForm": {
                        "from": "result",
                        "path": "arcForm",
                        "source": ""
                    },
                    "hisFormDesc": {
                        "from": "result",
                        "path": "arcForm_Desc",
                        "source": ""
                    }
                }
            }
        }
    },
 },
 {
    "name": "同步药品用量",
    "url": `${URL}/zxwz/onlineinquiry/syncArcFreqData`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
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
                    "hisFreq": {
                        "from": "result",
                        "path": "arcFreq",
                        "source": ""
                    },
                    "hisFreqDesc": {
                        "from": "result",
                        "path": "arcFreq_Desc",
                        "source": ""
                    },
                    "hisFreqAlias": {
                        "from": "result",
                        "path": "arcFreq_Desc2",
                        "source": ""
                    }
                }
            }
        }
    }
 },
 {
    "name": "同步药品用法",
    "url": `${URL}/zxwz/onlineinquiry/syncArcInstrData`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
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
                    "hisInstr": {
                        "from": "result",
                        "path": "arcInstr",
                        "source": ""
                    },
                    "hisInstrDesc": {
                        "from": "result",
                        "path": "arcInstr_Desc",
                        "source": ""
                    },
                    "hisInstrAlias": {
                        "from": "result",
                        "path": "arcInstr_Desc2",
                        "source": ""
                    }
                }
            }
        }
    }
 },
 {
    "name": "同步药品单位",
    "url": `${URL}/zxwz/onlineinquiry/syncArcUomData`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
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
                    "hisUom": {
                        "from": "result",
                        "path": "arcUom",
                        "source": ""
                    },
                    "hisUomDesc": {
                        "from": "result",
                        "path": "arcUom_Desc",
                        "source": ""
                    }
                }
            }
        }
    }
 },
 {
    "name": "获取药品库存",
    "url": `${URL}/zxwz/onlineinquiry/queryStockByDrugCode`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "data":{
        "arcCode":"9000020180710145238"
    },
    "cache": {
        "isCached": false,
    },
    "return": {
        "data":{
            "from":"result",
            "path":"data"
        }
    }
 },
 {
    "name": "获取药品订单数据",
    "url": `${URL}/zxwz/onlineinquiry/queryDrugOrder`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "cache": {
        "isCached": false,
    },
    "data": {
        "orderNo": "",
        "orderBeginDate": "2020-4-15 18:06:04",
        "orderEndDate": "2020-7-20 18:06:04"
    },
    "return":  {
        "list": {
            "from": "result",
            "path": "data",
        }
    }
 },
 {
    "name": "获取发药数量",
    "url": `${URL}/zxwz/onlineinquiry/getDrugTotalQty`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "data":{
        "singleDose":"2",
        "duration":"5",
        "arcFreq":"52",
        "arcCode":"11000018"
    },
    "cache": {
        "isCached": false,
    },
    "return": {
        "result": {
            "from": "result",
            "path": "data"
        }
    }
 },
 {
    "name": "获取最新门诊信息",
    "url": `${URL}/zxwz/onlineinquiry/queryLastOpdInquiryByCardNo`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "cache": {
        "isCached": false,
    },
    "data": {
        "admId": "20200415000004"
    },
    "return": {
        "result": {
            "from": "result",
            "path": "data"
        }
    }
 },
 {
    "name": "获取最新诊断信息",
    "url": `${URL}/zxwz/onlineinquiry/queryLastOpdDiagByCardNo`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "cache": {
        "isCached": false,
    },
    "data": {
        "admId": "20200415000004"
    },
    "return": {
        "result": {
          "from": "result",
          "path": "data"
        }
    }
 },
 {
    "name": "获取处方笺",
    "url": `${URL}/zxwz/onlineinquiry/queryPrescInfo`,
    "pre": {
        "hasPre": true,
        "apiName": "获取token",
        "processReturn":{
            "token":{
                "header":{
                    "name": "Authorization"
                }
            }
        }
    },
    "method": "POST",
    "data":{
        "orderNo":"5ecb7a82a7e81e7e02c15e48",
        "opcRegId":"2atjek9zazwjykpl"
    },
    "cache": {
        "isCached": false,
    },
    "return": {
        "result": {
          "from": "result",
          "path": "data"
        }
      }
 },
 {
    "name": "保存快递单号",
    "url": `${URL}/zxwz/onlineinquiry/saveExpressNo`,
    "pre": {
        "hasPre": false,
    },
    "method": "POST",
    "data":{
        "orderNo":"5ec4e26e9143317598148547",
        "expressNo":"12345"
    },
    "cache": {
        "isCached": false,
    },
    "return": {
        "result": {
            "from": "result",
            "path": "resultCode",
        }
    }
 },
]
module.exports = JINXIN_API_CONFIGS;