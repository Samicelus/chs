'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    indexRule: {
        params: {
            callbackTag: {
                type: 'string'
            },
            app_id: {
                type: 'string'
            }
        },
    },
};

class CallbackController extends Controller {
    async acceptCallback(){
        const { ctx, logger } = this;
        const {callbackTag, app_id} = ctx.params;
        const body = ctx.request.body;
        const requestIp = ctx.request.ip || ctx.ip;
        const headers = ctx.headers;
        const method = ctx.method;
        const query = ctx.query;

        try{
            const respondBody = await ctx.service.callback.getCallbackResult({
                app_id,
                callbackTag,
                method,
                body,
                query,
                headers,
                requestIp
            });
            ctx.body = respondBody;
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async analyseBackupFile(){
        try{
            const respondBody = await ctx.service.callback.analyseBackupFile({
                app_id,
                callbackTag,
                body,
                headers,
                requestIp
            });
            ctx.body = respondBody;
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
}

module.exports = CallbackController;
