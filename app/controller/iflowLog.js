'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    getIflowLogRule: {
        query: {
            search: {
                type: 'string',
                required: false
            },
            threshold: {
                type: 'int',
                required: false
            },
            hideSuccess: {
                type: 'boolean',
                required: false
            }, 
            hideFail: {
                type: 'boolean',
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
            }
        }
    },
    getIflowProcessTimeRule: {
        query: {
            company_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            begin: {
                type: 'string'
            },
            end: {
                type: 'string'
            }
        }
    }
};

class IflowLogController extends Controller {
    async getIflowLog() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getIflowLogRule);
        const {search, threshold, hideSuccess, hideFail, page, pageSize} = ctx.query;
        const {list, count} = await ctx.service.iflow.iflowLog.getIflowLog({
            search,
            threshold,
            hideSuccess,
            hideFail,
            page,
            pageSize
        });
        ctx.body = {
            result: true,
            list,
            count
        }
    };

    async getIflowProcessTime() {
        const { ctx } = this;
        ctx.helper.validate(Rules.getIflowProcessTimeRule);
        const {company_id, begin, end} = ctx.query;
        const {avg} = await ctx.service.iflow.iflowStatistic.getIflowProcessTime({
            company_id, begin, end
        });
        ctx.body = {
            result: true,
            avg
        }
    }
}

module.exports = IflowLogController;
