'use strict';

const Controller = require('egg').Controller;

const {DIAGNOSIS_TYPE_MAP} = require('../../const/model/advice');
// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    checkStorageRule: {
        query:{
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            rowid: {
                type: 'string'
            }
        }
    },
    syncMedicineRule: {
    },
    listMedicinesRule: {
    },
    createAdviceRule: {
        body: {
            //咨询单id
            consult_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            //诊断
            diagnosis: {
                type: 'string',
                max: 2000
            },
            //诊断类型
            diagnosisType: {
                type: 'enum',
                values: Object.keys(DIAGNOSIS_TYPE_MAP),
                required: true
            },
            //备注
            notes: {
                type: 'string',
                max: 2000,
                required: false
            },
            //所开药品列表
            advices: {
                type: 'array',
                itemType: 'object',
                rule: {
                    //药品id
                    medicine_id: {
                        type: 'string',
                        required: false,
                        regex: /^[a-f0-9]{24,24}$/
                    },
                    //开药数量
                    quantity: {
                        type: 'int'
                    },
                    //单位字典code
                    unit: {
                        type: 'string',
                        max: 50
                    },
                    //剂量数目
                    dosage: {
                        type: 'int'
                    },
                    //剂量字典code
                    dosageUnit: {
                        type: 'string',
                        max: 50
                    },
                    //用法字典code
                    method: {
                        type: 'string',
                        max: 50
                    },
                    //疗程字典code
                    duration: {
                        type: 'string',
                        max: 50
                    },
                    //频次字典code
                    frequency: {
                        type: 'string',
                        max: 50
                    },
                    //备注
                    notes: {
                        type: 'string',
                        max: 1000,
                        required: false
                    },
                    price: {
                        type: 'number',
                        required: true
                    }
                }
            }
        }
    },
    listAdvicesRule: {
        query: {
            consult_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getWaitAdviceRule: {
        query: {
            consult_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    sendAdviceRule: {
        body: {
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            //处方id
            consultAdvice_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class AdviceController extends Controller {

    async checkStorage() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.checkStorageRule);

        let medicine_id;

        if(ctx.query.medicine_id){
            medicine_id = ctx.query.medicine_id;
        }else{
            medicine_id = await ctx.service.module.advice.getIdByHisMedicine({
                app_id: ctx.query.app_id,
                hisMedicine: ctx.query.hisMedicine
            })
        }

        let result = await ctx.service.api.callConfigedApi({
            app_id: ctx.query.app_id,
            apiName: '查询单个药品库存',
            params:{
                medicine_id
            }
        });
        logger.info(result);
        ctx.body = {
            result: true,
            data: result
        }
    };

    async syncMedicine() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.syncMedicineRule);
        const {request:{body:{app_id}}} = ctx;
        let {list} = await ctx.service.api.callConfigedApi({
            app_id,
            apiName: '同步药品目录'
        });
        
        let result = await ctx.service.module.advice.updateMedicines({app_id, medicines: list});

        ctx.body = {
            result: true,
            medicines: result
        }
    };

    async listMedicines() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listMedicinesRule);
        let {list} = await ctx.service.module.advice.listMedicines({
            app_id: ctx.query.app_id,
            keyWord: ctx.query.keyWord
        });

        ctx.body = {
            result: true,
            list
        }
    };

    async createAdvice() {
        const { ctx, logger } = this;
        const {request:{body:{
            consult_id, 
            advices, 
            diagnosis, 
            diagnosisType, 
            notes
        }}} = ctx;
        ctx.helper.validate(Rules.createAdviceRule);
        const {advice} = await ctx.service.module.advice.createAdvice({
            consult_id,
            advices, 
            diagnosis, 
            diagnosisType, 
            notes
        })

        ctx.body = {
            result: true,
            data: advice
        }
    }

    async listAdvices() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listAdvicesRule);
        const {list} = await ctx.service.module.advice.listAdvices({
            consult_id: ctx.query.consult_id
        })
        ctx.body = {
            result: true,
            list
        }
    }

    async getWaitAdvice() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getWaitAdviceRule);
        const {advice} = await ctx.service.module.advice.getWaitAdvice({
            consult_id: ctx.query.consult_id
        })
        ctx.body = {
            result: true,
            advice
        }
    }

    async sendAdvice() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.sendAdviceRule);
        let result = await ctx.service.api.callConfigedApi({
            app_id: ctx.request.body.app_id,
            apiName: '向his写入处方',
            params: {
                consultAdvice_id: ctx.request.body.consultAdvice_id
            }
        });
        ctx.body = {
            result: true,
            data: result
        }
    }

}

module.exports = AdviceController;
