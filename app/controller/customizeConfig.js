'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    setConfigRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            key: {
                type: 'string'
            },
            value: {
                type: 'any'
            }
        },
    },
    getConfigRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            key: {
                type: 'string'
            }
        }
    }
};

class CustomizeConfigController extends Controller {
    async setConfig() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.setConfigRule);
        const data = await ctx.service.module.customizeConfig.setCustomizeConfig({
            app_id: ctx.request.body.app_id, 
            key: ctx.request.body.key,
            value: ctx.request.body.value
        });
        ctx.body = {
            result: true,
            data
        }
    };
    async getConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getConfigRule);
        const config = await ctx.service.module.customizeConfig.getCustomizeConfig({
            app_id: ctx.query.app_id,
            key: ctx.query.key
        });
        ctx.body = {
            result: true,
            data: config
        }
    }
}

module.exports = CustomizeConfigController;
