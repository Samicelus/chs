'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;

class DataBlockService extends Service {
    /**
     * 获取数据Block详情
     * 
     * @param {String} block_id 2.0版本黑盒id
     */
    async getDataBlockDetail({block_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let block = await model.DataBlock.findById(block_id).lean();
        return {block};
    }

    async updateDataBlock({block_id, returnConfig}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let block = await model.DataBlock.findByIdAndUpdate(block_id, {
            "$set":{
                return: returnConfig
            }
        },
        {
            new: true
        });
        return {block};
    }

    async createDataBlockToBox({box_id, name, returnConfig, inputData}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let block = await model.DataBlock({
            return: returnConfig
        }).save();
        let box = await model.Box.findById(box_id);
        if(box){
            box.topology.blocks[block._id] = {
                type: 'data',
                name,
                inputData,
                block_oid: block._id
            }
            box.markModified('topology');
            await box.save();
        }else{
            await model.DataBlock.findByIdAndRemove(block._id);
            throw new Error(`没找到 ${box_id} 对应的 box`);
        }
        return {box, block};
    }

    async deleteDataBlock({box_id, block_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let box = await model.Box.findById(box_id);
        if(box){
            for(let blockId in box.topology.blocks){
                let blockConfig = box.topology.blocks[blockId];
                dispatchBlockFromInput(blockConfig, block_id)
            }
            delete box.topology.blocks[block_id];
            box.markModified('topology');
            await box.save();
            await model.DataBlock.findByIdAndRemove(block_id);
        }else{
            throw new Error(`没找到 ${box_id} 对应的 box`);
        }
        return {box};
    }
}

module.exports = DataBlockService;

function dispatchBlockFromInput(blockConfig, block_id){
    switch(blockConfig.type){
        case "data":
            _.pull(blockConfig.inputData, block_id);
            break;
        case "request":
            _.pull(blockConfig.inputData, block_id);
            _.pull(blockConfig.headerData, block_id);
            _.pull(blockConfig.signData, block_id);
            break;
        default:
            break;
    }
}