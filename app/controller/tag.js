'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    addTagRule: {
        body: {
            tagName: {
                type: 'string',
                required: true,
                regex: /^[a-zA-Z0-9]{1,50}$/
            },
            description: {
                type: 'string',
                required: false
            }
        }
    },
    searchTagRule: {
        query: {
            search: {
                type: 'string',
                required: false
            }
        }
    }
};

class TagController extends Controller {
    async addTag() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.addTagRule);
            const {tagName, description} = ctx.request.body;
            const tag = await ctx.service.groupTag.tag.addTag({tagName, description});
            ctx.body = {
                result: true,
                tag
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    };

    async searchTag() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.searchTagRule);
            const {search} = ctx.query;
            const {list} = await ctx.service.groupTag.tag.searchTag(
                {
                    search
                })
            ctx.body = {
                result: true,
                list
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
    
}

module.exports = TagController;
