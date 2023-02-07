const URL_Pro = 'https://api.isignet.cn';
const URL = URL_Pro;
const BJCA_CA_CONFIGS = [
    {
        "name": "添加个人用户",
        "url": `${URL}/ASMSServer/v1/mssg/addtrustuserser`,
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
        "sign": {
            "enabled": true,
            "useData": true,
            "algorithm": "hmac",
            "addedParam": {},
            "salt": "eKeMPjZsUoOQ9c095z1xkiMklnX7gN8u",
            "path": "signature"
          },
        "data": {
            "name": "樊明慧",
            "idType": "SF",
            "idNumber": "511381199301272146",
            "mobile": "18215635021"
        },
        "dataMerge": {
            "version": {
                "from": "value",
                "path": "version",
                "source": "",
                "value": "1.0"
            },
            "signAlgo": {
                "from": "value",
                "path": "signAlgo",
                "source": "",
                "value": "HmacSHA256"
            },
            "appId": {
                "from": "customConfig",
                "path": "appId",
                "source": ""
            },
            "deviceId": {
                "from": "customConfig",
                "path": "deviceId",
                "source": ""
            }
        },
        "return": {
            "userId": {
                "from": "result",
                "path": "userId",
                "source": ""
            }
        }
    },
    {
        "name": "查询个人印章信息",
        "url": `${URL}/ASMSServer/v1/mssg/getUserStamp`,
        "pre": {
            "hasPre": false,
            "processReturn": {},
        },
        "sign": {
            "enabled": true,
            "useData": true,
            "algorithm": "hmac",
            "addedParam": {},
            "path": "signature",
            "salt": "eKeMPjZsUoOQ9c095z1xkiMklnX7gN8u"
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
            "userId": "e4fdcbe90cd47b1e4e149b0716150e29ae9078ed5bf7b60a79cd4d9109f6e1a8"
        },
        "dataMerge": {
            "transId": {
                "from": "system",
                "path": "transId",
                "source": "",
                "method": "dateNow"
            },
            "version": {
                "from": "value",
                "path": "version",
                "source": "",
                "value": "1.0"
            },
            "signAlgo": {
                "from": "value",
                "path": "signAlgo",
                "source": "",
                "value": "HmacSHA256"
            },
            "appId": {
                "from": "customConfig",
                "path": "appId",
                "source": ""
            },
            "deviceId": {
                "from": "customConfig",
                "path": "deviceId",
                "source": ""
            }
        },
        "return": {
            "userId": {
                "from": "result",
                "path": "userId",
                "source": ""
            },
            "stamp": {
                "from": "result",
                "path": "stamp",
                "source": ""
            }
        },
    },
    {
        "name": "添加签名任务",
        "url": `${URL}/ASMSServer/v1/mssg/addSignJob`,
        "pre": {
            "hasPre": true,
            "processReturn": {},
            "apiName": "同步医师信息接口"
        },
        "method": "POST",
        "sign": {
            "enabled": true,
            "useData": true,
            "algorithm": "hmac",
            "path": "signature",
            "salt": "eKeMPjZsUoOQ9c095z1xkiMklnX7gN8u",
            "addedParam": {}
        },
        "dataMerge": {
            "version": {
                "from": "value",
                "path": "version",
                "source": "",
                "value": "1.0"
            },
            "signAlgo": {
                "from": "value",
                "path": "signAlgo",
                "source": "",
                "value": "HmacSHA256"
            },
            "deviceId": {
                "from": "customConfig",
                "path": "deviceId",
                "source": ""
            },
            "appId": {
                "from": "customConfig",
                "path": "appId",
                "source": ""
            },
            "transId": {
                "from": "system",
                "path": "transId",
                "source": "",
                "method": "dateNow"
            },
            "data": {
                "from": "params",
                "path": "data",
                "source": "",
                "convert": {
                    "type": "String",
                    "default": "",
                    "enum": [],
                    "encrypt": true,
                    "coding": "base64"
                }
            },
            "signAlg": {
                "from": "value",
                "path": "SHA1withRSA",
                "source": "",
                "value": "SHA1withRSA"
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
            "userId": "e4fdcbe90cd47b1e4e149b0716150e29ae9078ed5bf7b60a79cd4d9109f6e1a8",
            "title": "电子病历",
            "dataType": "1",
            "operType": "1",
            "category": 1,
            "description": "摘要：维生素",
            "expireData": "60*24",
            "data": "Buffer.from(data).toString('base64')"
        },
        "return": {

        },
    },
    {
        "name": "获取签名认证",
        "url": `${URL}/ASMSServer/v1/mssg/getSignResult`,
        "pre": {
            "hasPre": false,
            "processReturn": {}
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
            "transId": "1594193160778",
            "signJobId": "8096b02c-2e11-46a9-bef2-30abb4a274b8"
        },
        "dataMerge": {
            "version": {
                "from": "value",
                "path": "version",
                "source": "",
                "value": "1.0"
            },
            "signAlgo": {
                "from": "value",
                "path": "signAlgo",
                "source": "",
                "value": "HmacSHA256"
            },
            "deviceId": {
                "from": "customConfig",
                "path": "deviceId",
                "source": ""
            },
            "appId": {
                "from": "customConfig",
                "path": "appId",
                "source": ""
            },
            "transId": {
                "from": "system",
                "path": "transId",
                "source": "",
                "method": "dateNow"
            }
        },
        "return": {
            "signJobId": {
                "from": "result",
                "path": "signJobId",
                "source": ""
            },
            "signResult": {
                "from": "result",
                "path": "signResult",
                "source": ""
            },
            "signCert": {
                "from": "result",
                "path": "signCert",
                "source": ""
            },
            "jobStatus": {
                "from": "result",
                "path": "jobStatus",
                "source": ""
            }
        },
    },
]
module.exports = BJCA_CA_CONFIGS;