'use strict';

const { item } = require('../../../const/schema/consultInspection');

const Service = require('egg').Service;

class tagService extends Service {

    async addTag({tagName, description}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let tag = await model.Tag({
            tagName,
            description
        }).save();

        return tag;
    }

    async searchTag({search}){
        const {ctx: { model }, logger, app: {_, mongoose: {Types: {ObjectId}}}} = this;

        let condition = {};
        
        if(search){
            condition.tagName = {
                "$regex": search
            };
        }

        let list = await model.Tag.find(condition).lean();

        //获取已被使用的标签
        let tagArrangements = await model.ApiGroupItem.find({})
        .populate('apiGroup_oid')
        .select('_id apiGroup_oid itemName tag_oid')
        .lean();

        let tagArrangementMap = _.groupBy(tagArrangements, 'tag_oid');

        list.forEach(tag=>{
            if(tagArrangements.map(item=>item.tag_oid.toString()).includes(tag._id.toString())){
                let arrangement = tagArrangementMap[tag._id][0];
                if(arrangement && arrangement.apiGroup_oid){
                    tag.arrangement = {
                        groupName: arrangement.apiGroup_oid.groupName,
                        itemName: arrangement.itemName
                    };
                }
            }
        })

        return {list};
    }

    async getTestParams({api_id}){
        const {ctx: { model }} = this;

        let testParams = {};

        let apiConfig = await model.ApiConfig.findById(api_id).select('tag_oid').lean();

        if(apiConfig && apiConfig.tag_oid){
            let apiGroupItem = await model.ApiGroupItem.findOne({
                tag_oid: apiConfig.tag_oid
            }).select('paramsExample').lean();

            if(apiGroupItem && apiGroupItem.paramsExample){
                testParams = apiGroupItem.paramsExample;
            }
        }

        return testParams;
    }

    async getTestReturn({api_id}){
        const {ctx: { model }} = this;

        let testReturn = {};

        let apiConfig = await model.ApiConfig.findById(api_id).select('tag_oid').lean();

        if(apiConfig && apiConfig.tag_oid){
            let apiGroupItem = await model.ApiGroupItem.findOne({
                tag_oid: apiConfig.tag_oid
            }).select('returnExample').lean();

            if(apiGroupItem && apiGroupItem.returnExample){
                testReturn = apiGroupItem.returnExample;
            }
        }

        return testReturn;
    }
}


module.exports = tagService;
