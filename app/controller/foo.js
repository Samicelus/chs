'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    indexRule: {
        query: {
            id: 'id',
        },
    },
};

class FooController extends Controller {
    async access() {
        const { ctx, logger } = this;
        ctx.body = {data:ctx.request.body, query:ctx.query, headers:ctx.headers}
    };

    async test(){
        const { 
            ctx, 
            app: {
                mongoose: {
                    Types: { ObjectId }
                }
            } 
        } = this;
        const {app_id, apiName, inputData} = ctx.request.body;
        const apiConfig = await ctx.model.ApiConfig.findOne({
            app_oid: ObjectId(app_id),
            name:apiName
        }).lean();

        const returned = await ctx.service.dataConvert.convertData({inputData, dataConfig:apiConfig.return, apiLog:{
            callResult: {},
            process:[]
        }});
        ctx.body = {
            returned
        }
    }

    async testCombine(){
        const { 
            ctx, 
            app: {
                mongoose: {
                    Types: { ObjectId }
                }
            } 
        } = this;
        const {app_id, apiName, inputData} = ctx.request.body;
        const apiConfig = await ctx.model.ApiConfig.findOne({
            app_oid: ObjectId(app_id),
            name:apiName
        }).lean();

        let data = {};

        const merged = await ctx.service.dataConvert.convertData({inputData, dataConfig:apiConfig.dataMerge, apiLog:{
            callResult: {},
            process:[]
        }});

        if(merged.result){
            _.merge(data, merged.data);
        }

        const returned = await ctx.service.dataConvert.convertData({inputData, dataConfig:apiConfig.return, apiLog:{
            callResult: {},
            process:[]
        }});

        if(returned.result){
            _.merge(data, returned.data);
        }

        ctx.body = {
            data
        }
    }

    async testBox(){
        const { 
            ctx, 
            app: {
                mongoose: {
                    Types: { ObjectId }
                }
            } 
        } = this;
        console.log(this)
        const {params, hospitalId, tagName} = ctx.request.body;

        let apiLog = {
            callResult: {},
            process:[]
        }

        let returned = await ctx.service.process.box.processBox({params, hospitalId, tagName});

        ctx.body = {
            returned
        }
    }

    async upgradeOneApi(){
        const { 
            ctx, 
            app: {
                mongoose: {
                    Types: { ObjectId }
                }
            } 
        } = this;
        const {api_id} = ctx.request.body;
        let box = await ctx.service.upgrade.upgrade.upgradeApiToBox({api_id});
        ctx.body = {
            box
        }
    }

    async actualBox(){
        const { 
            ctx, 
            app: {
                mongoose: {
                    Types: { ObjectId }
                }
            } 
        } = this;
        const {hospitalId, tag_id, inputData} = ctx.request.body;
        const box = await ctx.model.Box.findOne({
            tag_oid: ObjectId(tag_id),
            hospitalId
        }).lean();
        ctx.body = {
            returned
        }
    }
}

module.exports = FooController;
