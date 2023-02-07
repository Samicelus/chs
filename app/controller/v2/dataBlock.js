'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    getDataBlockDetailRule: {
        query: {
            block_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
    },
    updateDataBlockRule: {
        params: {
            block_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            returnConfig: {
                type: 'object',
                required: false
            }
        }
    },
    createDataBlockToBoxRule: {
        body: {
            box_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            name: {
                type: 'string'
            },
            returnConfig: {
                type: 'object',
                required: false
            },
            inputData: {
                type: 'array'
            }
        }
    },
    deleteDataBlockRule: {
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

class DataBlockController extends Controller {
    async getDataBlockDetail(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.getDataBlockDetailRule);

            const {block_id} = ctx.query;

            let {block} = await ctx.service.v2.dataBlock.getDataBlockDetail({block_id});

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

    async updateDataBlock(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.updateDataBlockRule);

            const {block_id} = ctx.params;

            const {returnConfig} = ctx.request.body;

            let {block} = await ctx.service.v2.dataBlock.updateDataBlock({block_id, returnConfig});

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

    async createDataBlockToBox(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.createDataBlockToBoxRule);

            const {box_id, name, returnConfig, inputData} = ctx.request.body;

            let {box, block} = await ctx.service.v2.dataBlock.createDataBlockToBox({box_id, name, returnConfig, inputData});

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

    async deleteDataBlock(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.deleteDataBlockRule);

            const {box_id, block_id} = ctx.request.body;

            let {box} = await ctx.service.v2.dataBlock.deleteDataBlock({box_id, block_id});

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

module.exports = DataBlockController;
