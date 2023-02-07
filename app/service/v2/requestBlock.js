'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;

class RequestBlockService extends Service {
    /**
     * 获取请求Block详情
     * 
     * @param {String} block_id 2.0版本黑盒id
     */
    async getRequestBlockDetail({block_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let block = await model.RequestBlock.findById(block_id).lean();
        return {block};
    }

    async updateRequestBlock({block_id, blockData}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let block = await model.RequestBlock.findByIdAndUpdate(block_id, blockData, {"upsert":true, new: true});
        return {block};
    }

    async createRequestBlockToBox({box_id, name, requestConfig, inputData, headerData, signData}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let block = await model.RequestBlock({
            ...requestConfig
        }).save();
        let box = await model.Box.findById(box_id);
        if(box){
            box.topology.blocks[block._id] = {
                type: 'request',
                name,
                inputData,
                headerData,
                signData,
                block_oid: block._id
            }
            box.markModified('topology');
            await box.save();
        }else{
            await model.RequestBlock.findByIdAndRemove(block._id);
            throw new Error(`没找到 ${box_id} 对应的 box`);
        }
        return {box, block};
    }

    async deleteRequestBlock({box_id, block_id}){
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
            await model.RequestBlock.findByIdAndRemove(block_id);
        }else{
            throw new Error(`没找到 ${box_id} 对应的 box`);
        }
        return {box};
    }
}

module.exports = RequestBlockService;

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