'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    getPushLogRule: {
        query: {
            search: {
                type: 'string',
                required: false
            },
            threshold: {
                type: 'int',
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
    resendFailRule: {
        body: {
            message_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class PushLogController extends Controller {
    async getPushLog() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getPushLogRule);
        let {startTime, endTime, search, threshold, hideSuccess, hideFail, page, pageSize} = ctx.query;
        hideSuccess = ctx.helper.toBoolean(hideSuccess);
        hideFail = ctx.helper.toBoolean(hideFail);
        const {list, count} = await ctx.service.push.pushLog.getPushLog({
            startTime,
            endTime,
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

    async resendFail() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.resendFailRule);
        try{
            let {message_id} = ctx.request.body;
            await ctx.service.push.pushLog.resendFail({message_id});
            ctx.body = {
                result: true
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }
}

module.exports = PushLogController;
