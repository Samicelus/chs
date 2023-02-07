'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    getRequestBlockDetailRule: {
        query: {
            block_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
    },
    updateRequestBlockRule: {
        params: {
            block_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            blockData: {
                type: 'object',
                required: false
            }
        }
    },
    createRequestBlockToBoxRule: {
        body: {
            box_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            name: {
                type: 'string'
            },
            requestConfig: {
                type: 'object',
                required: false
            },
            inputData: {
                type: 'array'
            },
            headerData: {
                type: 'array'
            },
            signData: {
                type: 'array'
            }
        }
    },
    deleteRequestBlockRule: {
        body: {
            box_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            block_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class RequestBlockController extends Controller {
    async getRequestBlockDetail(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.getRequestBlockDetailRule);

            const {block_id} = ctx.query;

            let {block} = await ctx.service.v2.requestBlock.getRequestBlockDetail({block_id});

            ctx.body = {
                result: true,
                block
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                code: '500',
                message: e.message
            }
        }
    }

    async updateRequestBlock(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.updateRequestBlockRule);

            const {block_id} = ctx.params;

            const {blockData} = ctx.request.body;

            let {block} = await ctx.service.v2.requestBlock.updateRequestBlock({block_id, blockData});

            ctx.body = {
                result: true,
                block
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                code: '500',
                message: e.message
            }
        }
    }

    async createRequestBlockToBox(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.createRequestBlockToBoxRule);

            const {box_id, name, requestConfig, inputData, headerData, signData} = ctx.request.body;

            let {box, block} = await ctx.service.v2.requestBlock.createRequestBlockToBox({box_id, name, requestConfig, inputData, headerData, signData});

            ctx.body = {
                result: true,
                box,
                block
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                code: '500',
                message: e.message
            }
        }
    }

    async deleteRequestBlock(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.deleteRequestBlockRule);

            const {box_id, block_id} = ctx.request.body;

            let {box} = await ctx.service.v2.requestBlock.deleteRequestBlock({box_id, block_id});

            ctx.body = {
                result: true,
                box
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                code: '500',
                message: e.message
            }
        }
    }
}

module.exports = RequestBlockController;
