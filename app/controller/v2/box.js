'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    listAppBoxesRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            }
        },
    },
    getBoxDetailRule: {
        query: {
            box_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
    },
    updateBoxRule: {
        params: {
            box_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            box: {
                type: 'object',
                required: false
            }
        }
    },
    createBoxRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            name: {
                type: 'string'
            },
            tag_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
        }
    }
};

class BoxController extends Controller {
    async listAppBoxes(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.listAppBoxesRule);

            const {app_id, search} = ctx.query;

            let {result, hospitalId} = await ctx.service.v2.box.getAppHospitalId({app_id});

            if(!result){
                throw new Error('未找到目标应用或目标应用未设置hospitalId');
            }
            console.log(hospitalId);
            let {list} = await ctx.service.v2.box.listHospitalBoxes({hospitalId ,search});
            ctx.body = {
                result: true,
                list
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

    async getBoxDetail(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.getBoxDetailRule);

            const {box_id} = ctx.query;

            let {box} = await ctx.service.v2.box.getBoxDetail({box_id});

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

    async updateBox(){
        const { ctx, logger } = this;
        console.log('enter controller!!!')
        try{
            ctx.helper.validate(Rules.updateBoxRule);

            const {box_id} = ctx.params;

            const {box} = ctx.request.body;

            let {box: boxData} = await ctx.service.v2.box.updateBox({box_id, box});

            ctx.body = {
                result: true,
                box: boxData
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

    async createBox(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.createBoxRule);

            const {app_id, name, tag_id} = ctx.request.body;

            let {box} = await ctx.service.v2.box.createBox({app_id, name, tag_id});

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

    async callBox(){
        const { 
            ctx, 
            app: {
                mongoose: {
                    Types: { ObjectId }
                }
            } 
        } = this;
        const {params, hospitalId, tagName} = ctx.request.body;

        let boxLog = {
            callResult: {},
            process:[]
        }

        let returned = await ctx.service.process.box.processBox({params, hospitalId, tagName, boxLog});

        await ctx.model.BoxLog(boxLog).save();

        ctx.body = {
            returned
        }
    }
}

module.exports = BoxController;
