'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;

const crypto = require('crypto');
const xml2js = require('xml2js-force-cdata');
const parser = new xml2js.Parser({
    explicitArray: false
});
const Parameter = require('parameter');
const parameter = new Parameter();

class BoxService extends Service {
    /**
     * 
     * box调用过程: 解析box中各block的topology并按输入需求调用
     * 
     * @param {Object}      params 调用入参
     * @param {Object}      box 处理过程
     */
    async processBox ({params, hospitalId, tagName, boxLog}){
        const {ctx, logger, app} = this;

        try{

            let tag = await ctx.model.Tag.findOne({tagName}).lean();
            let box = await ctx.model.Box.findOne({
                tag_oid: tag._id,
                "company.hospitalId": hospitalId
            }).lean();

            boxLog.box_oid = box._id;

            let {topology} = box;

            let endBlockName = topology.end;
            let endBlock = topology.blocks[endBlockName];
            
            let variables = {
                params
            };

            return await getReturn(ctx, topology.blocks, endBlockName, endBlock, variables, boxLog);
        }catch(e){
            logger.error(e);
        }
    }
}

module.exports = BoxService;

/**
 * 获取目标block结果
 * 
 * 验证目标block所需变量是否存在结果暂存器中，如果不存在则递归调用
 * 
 * @param {Object} ctx 上下文
 * @param {Object} blocks block关系
 * @param {String} blockName 目标block名称
 * @param {Object} targetBlock 目标block
 * @param {Object} variables 结果暂存器
 * 
 * @return {Object} block结果
 */
async function getReturn(ctx, blocks, blockName, targetBlock, variables, boxLog){
    if(!variables[blockName]){
        let fulfilled = false;
        let required = [];
        switch(targetBlock.type){
            case "data":
                required = targetBlock.inputData.filter((blockName)=>{
                    return !variables[blockName]
                });
                if(required.length==0){
                    fulfilled = true;
                }
                break;
            case "request":
                required = targetBlock.inputData.filter((blockName)=>{
                    return !variables[blockName]
                });
                required = required.concat(targetBlock.headerData.filter((blockName)=>{
                    return !variables[blockName]
                }));
                required = required.concat(targetBlock.signData.filter((blockName)=>{
                    return !variables[blockName]
                }));
                if(required.length==0){
                    fulfilled = true;
                }
                break;
            default:
                break;
        }
        if(fulfilled){
            return await getBlockReturn(ctx, targetBlock, variables, boxLog);
        }else{
            for(let requiredBlocks of required){
                variables[requiredBlocks] = await getReturn(ctx, blocks, requiredBlocks, blocks[requiredBlocks], variables, boxLog);
            }
            return await getBlockReturn(ctx, targetBlock, variables, boxLog);
        }
    }else{
        return variables[blockName];
    }
}


async function getBlockReturn(ctx, targetBlock, variables, boxLog){
    let returned = {};
    let blockConfig = targetBlock.blockConfig;
    switch(targetBlock.type){
        case "data":
            let result = await ctx.service.process.dataConvert.convertData({
                inputData: targetBlock.inputData.reduce((total, current)=>{
                    return _.merge(total, variables[current])
                }, {}),
                dataConfig: blockConfig,
                name: targetBlock.name,
                boxLog 
            });
            returned = result.data;
            break;
        case "request":
            returned = (await ctx.service.process.request.processRequest({
                inputData: targetBlock.inputData.reduce((total, current)=>{
                    return _.merge(total, variables[current])
                }, {}), 
                headerData: targetBlock.headerData.reduce((total, current)=>{
                    return _.merge(total, variables[current])
                }, {}), 
                signData: targetBlock.signData.reduce((total, current)=>{
                    return _.merge(total, variables[current])
                }, {}), 
                requestConfig: blockConfig, 
                name: targetBlock.name,
                boxLog
            })).data;
            break;
        default:
            break;
    }
    return returned
}
