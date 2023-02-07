'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    fillRecordRule: {
        body: {
            record: {                               //就诊记录
                type: 'object',
                rule: {
                    _id: {
                        type: 'string',
                        required: false,
                        regex: /^[a-f0-9]{24,24}$/
                    },
                    hospital: {
                        type: 'string',
                        required: false
                    },
                    date: {
                        type: 'string',
                        required: false
                    },
                    department: {
                        type: 'string',
                        required: false
                    },
                    doctor: {
                        type: 'string',
                        required: false
                    },
                    diagnosis: {
                        type: 'string',
                        required: false
                    },
                    pic: {
                        type: 'string',
                        required: false
                    }
                },
                required: true
            }
        },
        params:{
            consult_id: {                           //咨询单id
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getRecordsRule: {
        query: {
            patient_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getRecordDetailRule: {
        query: {
            consult_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    authRecordRule: {
        params: {
            consult_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class RecordController extends Controller {
    async fillRecord() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.fillRecordRule);
        const {record_id} = await ctx.service.module.record
        .saveRecord(ctx.request.body.record);
        const consultObj = await ctx.service.module.consult
        .renewConsultRecord(ctx.params.consult_id, record_id);
        app.bus.emit('recordRenewed', ctx.request.body.record);
        ctx.body = {
            result: true,
            consult: consultObj
        }
    };

    async getRecords() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getRecordsRule);
        let {patient_id} = ctx.query;
        let {list} = await ctx.service.module.record
        .getRecords(patient_id);
        ctx.body = {
            result: true,
            list
        }
    };

    async getRecordDetail() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getRecordDetailRule);
        let {consult_id} = ctx.query;
        let {consult} = await ctx.service.module.record
        .getRecordDetail(consult_id);
        ctx.body = {
            result: true,
            consult
        }
    };

    async authRecord() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.authRecordRule);
        let {consult_id} = ctx.params;
        let {consult} = await ctx.service.module.record
        .authRecord(consult_id);
        await ctx.service.module.consult.setRenewed(consult_id);
        ctx.body = {
            result: true,
            consult
        }
    };
}

module.exports = RecordController;
