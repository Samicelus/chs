'use strict';

const fs = require('fs');
const stream = require('stream');
const Controller = require('egg').Controller;
const {CONDITION_TYPE_MAP, DOC_MAP, KEYEVAL_ELEMENT_MAP, API_METHOD_MAP} = require('../../const/module/consult');
const {DEFAULT_MODULE_CONFIGS, DEFAULT_STATUS_CONFIGS, API_CONFIGS, CA_CONFIGS } = require('../../const/module/appConfig')
const {METHODS, DB_TYPES, JOIN_TYPES} = require('../../const/module/customizeModel');
// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    creatAppConfigRule: {
        body: {
            name: {
                type: 'string',
                required: true,
                max: 50
            },
            description: {
                type: 'string',
                required: false,
                max: 200
            },
            company: {
                type: 'object',
                rule: {
                    hospitalId: {
                        type: 'int'
                    },
                    hospitalName: {
                        type: 'string'
                    }
                },
                required: false
            },
            company_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            modules: {
                type: 'array',
                itemType: 'object',
                rule: {
                    name: {
                        type: 'string',
                        required: true,
                        max: 50
                    },
                    key: {
                        type: 'string',
                        required: true,
                        max: 50
                    },
                    actions: {
                        type: 'array',
                        itemType: 'object',
                        rule: {
                            //行为名称
                            name: {
                                type: 'string',
                                required: true,
                                max: 50
                            },
                            key: {
                                type: 'string',
                                required: true,
                                max: 50
                            },
                            //行为依赖
                            dependencies: {
                                type: 'array',
                                itemType: 'object',
                                rule: {
                                    //依赖模块的状态名
                                    statusName: {
                                        type: 'string',
                                        required: true,
                                        max: 50
                                    },
                                    //达成条件的值
                                    value: {
                                        type: 'string',
                                        required: true,
                                        max: 50
                                    },
                                },
                                required: false,
                                default: []
                            }
                        },
                        required: false,
                        default: []
                    }
                },
                required: false
            },
            status: {
                type: 'array',
                itemType: 'object',
                rule: {
                    //模块状态名
                    name: {
                        type: 'string',
                        required: true,
                        max: 50
                    },
                    //状态值枚举
                    values:{
                        type: 'array',
                        itemType: 'object',
                        rule: {
                            //枚举值
                            value: {
                                type: 'string',
                                required: true,
                                max: 50
                            },
                            condition: {
                                type: 'object',
                                rule: {
                                    //判断该状态值的方式
                                    conditionType: {
                                        type: 'enum',
                                        values: Object.keys(CONDITION_TYPE_MAP),
                                        required: true
                                    },
                                    //conditionType为hasDoc时需要,
                                    //寻找doc的目标数据库表名,格式大驼峰
                                    targetModel: {
                                        type: 'enum',
                                        values: Object.keys(DOC_MAP),
                                        required: false
                                    },
                                    //conditionType为hasDoc时需要,
                                    //满足条件的最少数据条目数
                                    min: {
                                        type: 'int',
                                        convertType: 'int',
                                        min: 1,
                                        required: false
                                    },
                                    //conditionType为hasDoc时非必须,
                                    //额外条件,如只查询未支付处方
                                    //TODO: 这里可能要内置一些条件供选择
                                    extra: {
                                        type: 'object',
                                        required: false
                                    },
                                    //conditionType为keyEval时需要,
                                    //判断的目标要素
                                    targetElement: {
                                        type: 'enum',
                                        values: Object.keys(KEYEVAL_ELEMENT_MAP),
                                        required: false
                                    },
                                    //conditionType为keyEval时需要,
                                    //目标要素的键名
                                    elementKey: {
                                        type: 'string',
                                        max: 50,
                                        required: false
                                    },
                                    //conditionType为keyEval时需要,
                                    //达成条件的键值
                                    elementEval: {
                                        type: 'string',
                                        max: 50,
                                        required: false
                                    },
                                    //conditionType为apiValidate时需要,
                                    //TODO: 需要事先定义好一系列service
                                    //建议/services/evaluateApi.js定义
                                    service: {
                                        type: 'string',
                                        required: false
                                    }
                                }
                            },
                            isDefault: {
                                type: 'boolean',
                                required: false,
                                default: false,
                            }
                        },
                        required: true,
                        min: 1
                    }
                },
                required: false
            },
            apis: {
                type: 'array',
                itemType: 'object',
                rule: {
                    //api名称
                    name: {
                        type: 'string',
                        required: true,
                        max: 200
                    },
                    //调用api的地址
                    url: {
                        type: 'string',
                        required: true,
                        max: 1000
                    },
                    //前置api配置
                    pre: {
                        type: 'object',
                        rule: {
                            hasPre: {
                                type: 'boolean',
                                default: false
                            },
                            apiName: {
                                type: 'string',
                                required: true,
                                max: 200
                            },
                            //如何处理前置api的结果
                            processReturn: {
                                type: 'object'
                            }
                        }
                    },
                    method: {
                        type: 'enum',
                        required: false,
                        values: Object.keys(API_METHOD_MAP),
                        default: "GET"
                    },
                    //固定入参
                    data: {
                        type: 'object'
                    },
                    //缓存配置
                    cache: {
                        type: 'object',
                        rule: {
                            isCached: {
                                type: 'boolean',
                                default: false
                            },
                            cacheKey: {
                                type: 'string',
                                required: true,
                                max: 50
                            },
                            cacheTime: {
                                type: 'object',
                                rule: {
                                    default: {
                                        type: 'int',
                                        min: 1
                                    },
                                    byReturn: {
                                        type: 'boolean',
                                        default: false
                                    }
                                }
                            }
                        }
                    },
                    //返回处理
                    return: {
                        type: 'object'
                    }
                },
                required: false
            },
            template_ids: {
                type: 'array',
                itemType: 'string',
                regex: /^[a-f0-9]{24,24}$/,
                required: false
            }
        },
    },
    setAlertBotRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            webhook: {
                type: 'string',
                required: false,
                max: 200
            },
            mentioned_list: {
                type: 'array',
                required: false
            }
        }
    },
    importFromTemplateRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            template_ids: {
                type: 'array',
                itemType: 'string',
                regex: /^[a-f0-9]{24,24}$/,
                required: false
            },
            importType:{
                type: 'string',
                required: false
            }
        }
    },
    setAppSecretRule: {
        body:{
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            secret: {
                type: 'string',
                required: true
            },
            agentid: {
                type: 'string',
                required: true
            }
        }
    },
    deleteAppConfigRule: {
        params: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    listAppConfigRule: {
        query: {
            name: {
                type: 'string',
                required: false,
                max: 50
            },
            hospitalId: {
                type: 'string',
                required: false
            },
            company_id: {
                type: 'string',
                regex: /^[a-f0-9]{24,24}$/,
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "name" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            },
        },
    },
    listModuleConfigRule: {
        query: {
            name: {
                type: 'string',
                required: false,
                max: 50
            },
            //校验ObjectId格式
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 200,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "name" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            },
        },
    },
    updateModuleRule: {
        body: {
            module_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            module: {
                type: 'object'
            }
        }
    },
    listStatusConfigRule: {
        query: {
            name: {
                type: 'string',
                required: false,
                max: 50
            },
            //校验ObjectId格式
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 200,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "name" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            },
        },
    },
    updateStatusRule: {
        body: {
            status_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            status: {
                type: 'object'
            }
        }
    },
    listApiConfigRule: {
        query: {
            name: {
                type: 'string',
                required: false,
                max: 50
            },
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "name" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            },
        }
    },
    getApiDetailRule: {
        query:{
            api_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportApiXLSXRule: {
        query: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportApiDocRule: {
        query: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportApisDocRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportApiMDRule: {
        query: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportApisMDRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    listApiLogRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            api_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false,
                max: 50
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "log_time", "created" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            },
            onlyTimeout: {
                type: 'enum',
                required: false,
                values: ["true","false"]
            }
        }
    },
    clearApiLogRule: {
        body: {
            api_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    listCallbackLogRule: {
        query: {
            callback_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false,
                max: 50
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "log_time", "created" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        }
    },
    createCallbackRule: {
        body: {
            app_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            callback: {
                type: 'object',
                rule: {
                    name: {
                        type: 'string'
                    },
                    callbackUrl: {
                        type: 'string',
                        required: false
                    },
                    callbackTag: {
                        type: 'string'
                    },
                    mock: {
                        type: 'object',
                        required: false,
                        rule: {
                            enable: {
                                type: 'boolean',
                                default: false
                            },
                            dataType:{
                                type: 'string'
                            },
                            mockReturn: {
                                type: 'object'
                            }
                        }
                    },
                    methodConfigs:{
                        type: 'array',
                        rule: {
                            method: {
                                type: 'string'
                            },
                            verifySignature: {
                                type: 'object',
                                rule: {
                                    enable: {
                                        type: 'boolean',
                                        default: false,
                                        required: false
                                    },
                                    algorithm: {
                                        type: 'string',
                                        required: false
                                    },
                                    coding: {
                                        type: 'string',
                                        required: false
                                    },
                                    enableSeparator: {
                                        type: 'boolean',
                                        default: false,
                                        required: false
                                    },
                                    separator: {
                                        type: 'string',
                                        required: false,
                                        default: '&'
                                    },
                                    signature: {
                                        type: 'object',
                                        rule: {
                                            path: {
                                                type: 'string',
                                                required: false
                                            },
                                            origin: {
                                                type: 'enum',
                                                values: ["body","query","param","header","customConfig"],
                                                required: false
                                        
                                            }
                                        }
                                    }  
                                }
                            },
                            verifykey: {
                                type: 'array',
                                itemType: 'object',
                                rule: {
                                    path: {
                                        type: 'string',
                                        required: false
                                    },
                                    origin: {
                                        type: 'string',
                                        required: false
                                    }
                                },
                                required: false
                            },
                            bodyType: {
                                type: 'enum',
                                values: ["json", "text"],
                                default: "json",
                                required: false
                            },
                            convertText: {
                                type: 'string',
                                required: false
                            },
                            callApis: {
                                type: 'array',
                                itemType: 'string',
                                required: false
                            },
                            asReturn: {
                                type: 'string',
                                required: false
                            },
                            keyAsReturn: {
                                type: 'boolean',
                                default: false
                            },
                            returnKeyPath: {
                                type: 'string',
                                required: false
                            }

                        }
                    }
                }
            }
        }
    },
    createApiRule: {
        body: {
            app_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            api: {
                type: 'object',
                rule: {
                    cache: {
                        type: 'object'
                    },
                    data: {
                        type: 'object'
                    },
                    dataMerge: {
                        type: 'object'
                    },
                    dataSource: {
                        type: 'array',
                        itemType: 'object',
                        rule: {
                            sourceName: {
                                type: 'string'
                            },
                            path: {
                                type: 'string'
                            },
                            modelName: {
                                type: 'string'
                            },
                            dbType: {
                                type: 'enum',
                                values: DB_TYPES
                            },
                            joins: {
                                type: 'array',
                                itemType: 'object',
                                rule: {
                                    joinType: {
                                        type: 'enum',
                                        values: JOIN_TYPES
                                    },
                                    joinKey: {
                                        type: 'string'
                                    },
                                    targetKey: {
                                        type: 'string',
                                        required: false
                                    },
                                    joinModel: {
                                        type: 'string',
                                        required: false
                                    }
                                }
                            },
                            query: {
                                type: 'string',
                                required: false
                            }
                        }
                    },
                    dataType: {
                        type: 'string'
                    },
                    headers: {
                        type: 'object'
                    },
                    method: {
                        type: 'enum',
                        values: METHODS
                    },
                    name: {
                        type: 'string'
                    },
                    pre: {
                        type: 'object'
                    },
                    return: {
                        type: 'object'
                    },
                    sign: {
                        type: 'object'
                    },
                    bodyConfig: {
                        type: 'object'
                    },
                    tag_oid: {
                        type: 'string',
                        required: false,
                        regex: /^[a-f0-9]{24,24}$/
                    },
                    threshold: {
                        type: 'int',
                        min: -1
                    },
                    protocal: {
                        type: 'string',
                        required: false
                    },
                    host: {
                        type: 'string',
                        required: false
                    },
                    url: {
                        type: 'string'
                    },
                    validate: {
                        type: 'object',
                        required: false
                    },
                    validateConfig: {
                        type: 'object',
                        required: false
                    },
                    mock: {
                        type: 'object',
                        required: false
                    }
                }
            }
        }
    },
    copyApiRule: {
        body: {
            api_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            newName:{
                type: 'string',
                required: true
            }
        }
    },
    updateApiRule: {
        body: {
            api_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            api: {
                type: 'object'
            }
        }
    },
    updateCallbackRule: {
        params: {
            callback_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            callback: {
                type: 'object',
                rule: {
                    name: {
                        type: 'string'
                    },
                    callbackUrl: {
                        type: 'string',
                        required: false
                    },
                    callbackTag: {
                        type: 'string'
                    },
                    mock: {
                        type: 'object',
                        required: false,
                        rule: {
                            enable: {
                                type: 'boolean',
                                default: false
                            },
                            dataType:{
                                type: 'string'
                            },
                            mockReturn: {
                                type: 'object'
                            }
                        }
                    },
                    methodConfigs:{
                        type: 'array',
                        rule: {
                            method: {
                                type: 'string'
                            },
                            verifySignature: {
                                type: 'object',
                                rule: {
                                    enable: {
                                        type: 'boolean',
                                        default: false,
                                        required: false
                                    },
                                    algorithm: {
                                        type: 'string',
                                        required: false
                                    },
                                    coding: {
                                        type: 'string',
                                        required: false
                                    },
                                    enableSeparator: {
                                        type: 'boolean',
                                        default: false,
                                        required: false
                                    },
                                    separator: {
                                        type: 'string',
                                        required: false,
                                        default: '&'
                                    },
                                    signature: {
                                        type: 'object',
                                        rule: {
                                            path: {
                                                type: 'string',
                                                required: false
                                            },
                                            origin: {
                                                type: 'enum',
                                                values: ["body","query","param","header","customConfig"],
                                                required: false
                                        
                                            }
                                        }
                                    }  
                                }
                            },
                            verifykey: {
                                type: 'array',
                                itemType: 'object',
                                rule: {
                                    path: {
                                        type: 'string',
                                        required: false
                                    },
                                    origin: {
                                        type: 'string',
                                        required: false
                                    }
                                },
                                required: false
                            },
                            bodyType: {
                                type: 'enum',
                                values: ["json", "text"],
                                default: "json",
                                required: false
                            },
                            convertText: {
                                type: 'string',
                                required: false
                            },
                            callApis: {
                                type: 'array',
                                itemType: 'string',
                                required: false
                            },
                            asReturn: {
                                type: 'string',
                                required: false
                            },
                            keyAsReturn: {
                                type: 'boolean',
                                default: false
                            },
                            returnKeyPath: {
                                type: 'string',
                                required: false
                            }

                        }
                    }
                }
            }
        }
    },
    getCallbackDetailRule: {
        query: {
            callback_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    deleteCallbackRule: {
        params: {
            callback_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    deleteApiRule: {
        params: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    adjustApiGroupRule: {
        params: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            apiGroup_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getCustomizeConfigRule: {
        query: {
            app_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    updateCustomizeConfigRule: {
        body:{
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            config: {
                type: 'object'
            }
        }
    },
    searchApiTemplateRule: {
        query:{
            search: {
                type: 'string',
                required: false
            }
        }
    },
    getSoapWSDLRule: {
        query: {
            protocal: {
                type: 'string',
                required: false
            },
            host: {
                type: 'string',
                required: false
            },
            url: {
                type: 'string',
                required: false
            }
        }
    },
    fetchAlreadyHostRule:{
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class consultModulationController extends Controller {

    async getSystemInfo(){
        const { ctx } = this;
        let {version} = require('../../package.json');
        let revision = require('../../revision.json');
        ctx.body = {
            result: true,
            version,
            revision
        }
    }

    async creatAppConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.creatAppConfigRule);
        const {name, description, company, company_id, hisTemplate,caTemplate, template_ids } = ctx.request.body;
        let {modules, status, apis} = ctx.request.body;
        const appConfig = await ctx.service.consultModulation
        .createAppConfig({name, description, company, company_id});
        const app_oid = appConfig._id;
        // if(!modules){
        //     modules = DEFAULT_MODULE_CONFIGS;
        // }
        // if(!status){
        //     status = DEFAULT_STATUS_CONFIGS;
        // }
        // if(!apis){
        //     const hisArray = hisTemplate&&API_CONFIGS[hisTemplate]?API_CONFIGS[hisTemplate]:API_CONFIGS.DEFAULT;
        //     const caArray = caTemplate&&CA_CONFIGS[caTemplate]?CA_CONFIGS[caTemplate]:CA_CONFIGS.DEFAULT;
        //     apis = [...hisArray,...caArray];
        // }
        // const moduleResult = await ctx.service.consultModulation
        // .createModuleConfigs({app_oid, modules})
        // const statusResult = await ctx.service.consultModulation
        // .createStatusConfigs({app_oid, status})
        // const apiResult = await ctx.service.consultModulation
        // .createApiConfigs({app_oid, apis})
        const apiResult = await ctx.service.consultModulation
        .createApiFromTemplate({app_id:app_oid, template_ids})
        ctx.body = {
            result: true,
            appConfig,
            // modules: moduleResult,
            // status: statusResult,
            api: apiResult
        }
    }

    async setAlertBot(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.setAlertBotRule);
            let {app_id, webhook, mentioned_list} = ctx.request.body;
            await ctx.service.qywechat.setAlertBot({app_id, webhook, mentioned_list});
            ctx.body = {
                result: true
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async importFromTemplate(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.importFromTemplateRule);
            const {app_id, template_ids, importType='api|callback' } = ctx.request.body;
            let importTypeArr = importType.split('|');
            let apiResult;
            let callbackResult;
            if(importTypeArr.includes('api')){
                apiResult = await ctx.service.consultModulation
                .createApiFromTemplate({app_id, template_ids});
            }
            if(importTypeArr.includes('callback')){
                callbackResult = await ctx.service.consultModulation
                .createCallbackFromTemplate({app_id, template_ids});
            }
            ctx.body = {
                result: true,
                api: apiResult,
                callback: callbackResult
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async setAppSecret(){
        const { ctx } = this;
        ctx.helper.validate(Rules.setAppSecretRule);
        const result = await ctx.service.consultModulation.setAppSecret({
            app_id: ctx.request.body.app_id,
            secret: ctx.request.body.secret,
            agentid: ctx.request.body.agentid
        })
        ctx.body = {
            result
        }
    };

    async deleteAppConfig() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.deleteAppConfigRule);
        const {app_id} = ctx.params;
        const result = await ctx.service.consultModulation
        .deleteAppConfig({app_id});
        ctx.body = {
            result
        }
    };

    async listAppConfig() {
        const { ctx } = this;
        ctx.helper.validate(Rules.listAppConfigRule);
        const {
            name,
            hospitalId,
            company_id,
            page=1, 
            pageSize=10, 
            sortField, 
            sortOrder
        } = ctx.query;
        const {userInfo} = ctx.request;
        const {list, count} = await ctx.service.consultModulation
        .listAppConfig({
            userInfo: ctx.request.userInfo,
            name, 
            hospitalId,
            company_id,
            page,
            pageSize,
            sortField,
            sortOrder,
            user_id: userInfo._id
        });
        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async listModuleConfig() {
        const { ctx } = this;
        ctx.helper.validate(Rules.listModuleConfigRule);
        const {
            name,
            app_id,
            page=1, 
            pageSize=10, 
            sortField, 
            sortOrder
        } = ctx.query;
        const {list, count} = await ctx.service.consultModulation
        .listModuleConfig({
            name, 
            app_id,
            page,
            pageSize,
            sortField,
            sortOrder
        });
        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async updateModule(){
        const { ctx } = this;
        ctx.helper.validate(Rules.updateModuleRule);
        const data = await ctx.service.consultModulation.updateModule(
            {
                module_id:ctx.request.body.module_id,
                module: ctx.request.body.module
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async listStatusConfig() {
        const { ctx } = this;
        ctx.helper.validate(Rules.listStatusConfigRule);
        const {
            name,
            app_id,
            page=1, 
            pageSize=10, 
            sortField, 
            sortOrder
        } = ctx.query;
        const {list, count} = await ctx.service.consultModulation
        .listStatusConfig({
            name, 
            app_id,
            page,
            pageSize,
            sortField,
            sortOrder
        });
        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async updateStatus(){
        const { ctx } = this;
        ctx.helper.validate(Rules.updateStatusRule);
        const data = await ctx.service.consultModulation.updateStatus(
            {
                status_id:ctx.request.body.status_id,
                status: ctx.request.body.status
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async listApiConfig() {
        const { ctx } = this;
        ctx.helper.validate(Rules.listApiConfigRule);
        const {
            name,
            app_id,
            sortField, 
            sortOrder
        } = ctx.query;
        const { userInfo } = ctx.request; 
        const {list, callbackList, count} = await ctx.service.consultModulation
        .listApiConfig({
            name, 
            app_id,
            sortField,
            sortOrder,
            user_id: userInfo._id
        });
        ctx.body = {
            result: true,
            list,
            callbackList,
            count
        }
    }

    async getApiDetail() {
        const { ctx } = this;
        ctx.helper.validate(Rules.getApiDetailRule);
        const data = await ctx.service.consultModulation.getApiDetail({api_id:ctx.query.api_id});

        ctx.body = {
            result: true,
            data
        }
    }

    async exportApiXLSX(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportApiXLSXRule);
        const {data, name} = await ctx.service.consultModulation.formApiXLSX({api_id:ctx.query.api_id});
        ctx.attachment(`/${name}.xlsx`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = data;
    }

    async exportApiDoc(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportApiDocRule);
        const {data, name} = await ctx.service.consultModulation.formApiDoc({api_id:ctx.query.api_id});
        let fileStream = new stream.PassThrough();
        fileStream.end(data);
        ctx.attachment(`/${name}.docx`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = fileStream;
    }

    async exportApisDoc(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportApisDocRule);
        const {data, name} = await ctx.service.consultModulation.formApisDoc({app_id:ctx.query.app_id});
        let fileStream = new stream.PassThrough();
        fileStream.end(data);
        ctx.attachment(`/${name}.docx`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = fileStream;
    }

    async exportApiMD(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportApiMDRule);
        const data = await ctx.service.consultModulation.formApiMD({api_id:ctx.query.api_id});
        let fileStream = new stream.PassThrough();
        fileStream.end(new Buffer(data));
        ctx.attachment(`/${ctx.query.api_id}.md`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = fileStream;
    }

    async exportApisMD(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportApisMDRule);
        const data = await ctx.service.consultModulation.formApisMD({app_id:ctx.query.app_id});
        let fileStream = new stream.PassThrough();
        fileStream.end(new Buffer(data));
        ctx.attachment(`/${ctx.query.app_id}.md`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = fileStream;
    }

    async listApiLog() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listApiLogRule);
        const {
            app_id,
            api_id,
            search,
            page=1, 
            pageSize=10, 
            sortField, 
            sortOrder,
            onlyTimeout,
            success
        } = ctx.query;
        const {userInfo} = ctx.request;
        const {list, count} = await ctx.service.consultModulation
        .listApiLog({ 
            app_id,
            api_id,
            search,
            page,
            pageSize,
            sortField,
            sortOrder,
            onlyTimeout: onlyTimeout=="true",
            success,
            user_id: userInfo._id
        });
        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async clearApiLog() {
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.clearApiLogRule);
            const {api_id} = ctx.request.body;
            const {result} = await ctx.service.consultModulation
            .clearApiLog({
                api_id
            });
            ctx.body = {
                result,
                message: result?'清除日志成功':'清除日志失败'
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async listCallbackLog() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listCallbackLogRule);
        const {
            callback_id,
            search,
            page=1, 
            pageSize=10, 
            sortField, 
            sortOrder,
            success
        } = ctx.query;
        const {userInfo} = ctx.request;
        const {list, count} = await ctx.service.consultModulation
        .listCallbackLog({ 
            callback_id, 
            search, 
            page, 
            pageSize,
            sortField,
            sortOrder, 
            success,
            user_id: userInfo._id
        });
        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async getApiStatistics(){
        const { ctx } = this;
        const {
            api_id,
            start,
            end
        } = ctx.query;
        const {statistics, success, fail, name, ttf} = await ctx.service.consultModulation
        .getApiStatistics({ 
            api_id,
            start,
            end
        });
        ctx.body = {
            result: true,
            statistics,
            success,
            fail,
            name,
            ttf
        }
    }

    async createCallback(){
        const { ctx, logger } = this;
        try {
            console.log(ctx.request.body)
            ctx.helper.validate(Rules.createCallbackRule);
            const data = await ctx.service.consultModulation.createCallback(
                {
                    app_id:ctx.request.body.app_id,
                    callback: ctx.request.body.callback
                }
            )
            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
        
    }

    async createApi(){
        const { ctx } = this;
        ctx.helper.validate(Rules.createApiRule);
        const data = await ctx.service.consultModulation.createApi(
            {
                app_id:ctx.request.body.app_id,
                api: ctx.request.body.api
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async copyApi(){
        const { ctx } = this;
        ctx.helper.validate(Rules.copyApiRule);
        let {api_id, newName} =  ctx.request.body;
        const data = await ctx.service.consultModulation.copyApi(
            {
                api_id,
                newName
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async updateApi(){
        const { ctx } = this;
        ctx.helper.validate(Rules.updateApiRule);
        const {api_id, api} = ctx.request.body;
        const data = await ctx.service.consultModulation.updateApi(
            {
                api_id,
                api
            }
        )
        let keyFlashed = false;
        if(api.cache.flashNow && api.cache.cacheKey){
            let key = `consult:${api.app_oid}:${api.cache.cacheKey}`;
            await ctx.service.consultModulation.flashCache({
                key
            })
            keyFlashed = true;
        }
        
        ctx.body = {
            result: true,
            data,
            keyFlashed
        }
    }

    async updateCallback(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.updateCallbackRule);
            const {callback_id} = ctx.params;
            const {callback} = ctx.request.body;
            const data = await ctx.service.consultModulation.updateCallback({callback_id, callback});
            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
        
    }

    async getCallbackDetail(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.getCallbackDetailRule);
            const {callback_id} = ctx.query;
            const data = await ctx.service.consultModulation.getCallbackDetail(
                {
                    callback_id
                }
            )
            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async deleteCallback(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.deleteCallbackRule);
            const {callback_id} = ctx.params;
            const data = await ctx.service.consultModulation.deleteCallback(
                {
                    callback_id
                }
            )
            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async deleteApi(){
        const { ctx } = this;
        ctx.helper.validate(Rules.deleteApiRule);
        const {api_id} = ctx.params;
        const data = await ctx.service.consultModulation.deleteApi(
            {
                api_id
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async adjustApiGroup(){
        const { ctx } = this;
        ctx.helper.validate(Rules.adjustApiGroupRule);
        const {api_id} = ctx.params;
        const {apiGroup_id} = ctx.request.body;
        const data = await ctx.service.consultModulation.adjustApiGroup(
            {
                api_id,
                apiGroup_id
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async getCustomizeConfig() {
        const { ctx } = this;
        ctx.helper.validate(Rules.getCustomizeConfigRule);
        const data = await ctx.service.consultModulation.getCustomizeConfig({app_id:ctx.query.app_id})
        ctx.body = {
            result: true,
            data
        }
    }

    async updateCustomizeConfig(){
        const { ctx } = this;
        ctx.helper.validate(Rules.updateCustomizeConfigRule);
        const data = await ctx.service.consultModulation.updateCustomizeConfig(
            {
                app_id:ctx.request.body.app_id,
                config: ctx.request.body.config
            }
        )
        ctx.body = {
            result: true,
            data
        }
    }

    async getCompany() {
        const { ctx } = this;
        console.log('**************************')
        console.log(ctx.request);
        const list = await ctx.service.consultModulation
        .getCompanies({
            userInfo: ctx.request.userInfo
        });
        ctx.body = {
            result: true,
            list
        }
    }

    async getDocMap() {
        const { ctx } = this;
        
        const {
            KEYEVAL_ELEMENT_MAP,
            API_METHOD_MAP,
            API_RETURN_JUDGE_MAP,
            API_FORM_DATA_FROM_MAP,
            SYSTEM_METHOD_MAP,
            ENCODE_MAP,
            SIGNPOSITION_MAP,
            SORTTYPE_MAP,
            DATA_TYPE_MAP,
            PROTOCAL_MAP,
            CONTENT_TYPE_MAP,
            CONVERT_TEXT_MAP,
            DESENSITIZATION_MAP,
            CRYPTO_METHOD_MAP,
            HASH_METHOD_MAP,
            CONVERT_DATA_TYPE_MAP
        } = require('../../const/module/consult');

        ctx.body = {
            result: true,
            contentType: CONTENT_TYPE_MAP,
            from: API_FORM_DATA_FROM_MAP,
            system: SYSTEM_METHOD_MAP,
            hash: HASH_METHOD_MAP,
            encode: ENCODE_MAP,
            crypto: CRYPTO_METHOD_MAP,
            signPosition: SIGNPOSITION_MAP,
            sortType: SORTTYPE_MAP,
            dataType: DATA_TYPE_MAP,
            protocal: PROTOCAL_MAP,
            convertText: CONVERT_TEXT_MAP,
            elements: KEYEVAL_ELEMENT_MAP,
            desensitization: DESENSITIZATION_MAP
        }
    }

    async searchApiTemplate(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.searchApiTemplateRule);
            const {search} = ctx.query;
            const {list, templates} = await ctx.service.consultModulation.searchApiTemplate({
                search
            })
            ctx.body = {
                result: true,
                list,
                templates
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    /**
     * 配置soap接口时用于获取soap的wsdl以及description
     */
    async getSoapWSDL(){
        const {ctx, logger} = this;
        try {
            ctx.helper.validate(Rules.getSoapWSDLRule);
            let {protocal, host, url} = ctx.query;

            let hostRoute = [];
                if(host){
                    hostRoute.push(host);
                }
                if(url){
                    hostRoute.push(url);
                }
                
            url = (protocal||"") + hostRoute.join('/');

            const {wsdl, description} = await ctx.service.consultModulation.getSoapWSDL({
                url
            })
            ctx.body = {
                result: true,
                wsdl,
                description
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async fetchAlreadyHost(){
        const {ctx, logger} = this;
        try {
            ctx.helper.validate(Rules.fetchAlreadyHostRule);
            let {app_id} = ctx.query;

            const hosts = await ctx.service.consultModulation.fetchAlreadyHost({
                app_id
            })
            ctx.body = {
                result: true,
                hosts
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
}

module.exports = consultModulationController;
