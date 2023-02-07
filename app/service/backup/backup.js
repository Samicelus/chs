'use strict';

const Service = require('egg').Service;
const _ = require('lodash');

class BackupService extends Service {
    async exportConfigs({app_id}) {
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        const app = await model.AppConfig.findById(app_id).lean();

        const apis = await model.ApiConfig.find({
            app_oid: ObjectId(app_id)
        }).lean();

        apis.forEach(item=>{
            delete item.apiTemplate_oid;
            delete item.apiGroup_oid;
            delete item.app_oid;
        })

        let tag_oids = apis.map(item=>item.tag_oid);
        
        const tags = await model.Tag.find({
            _id: {
                "$in": tag_oids
            }
        }).lean();

        const consultCustomizeConfig = await model.ConsultCustomizeConfig.findOne({
            app_oid: ObjectId(app_id)
        }).lean();
        
        return {
            fileName: _.get(app, 'company.hospitalName', _.get(app, 'name')),
            apis,
            tags,
            customizeConfig: consultCustomizeConfig?consultCustomizeConfig.config:{}
        };
    }

    async analyseBackupFile({content, app_id}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let tagNames = content.tags.map(item=>item.tagName);

        const existTags = await model.Tag.find({
            tagName: {
                "$in": tagNames
            }
        }).lean();

        let existTagNames = existTags.map(item=>item.tagName);
        let existTagNamesMap = {};
        let notExistTags = _.filter(content.tags, item=>{
            return !existTagNames.includes(item.tagName)
        });

        for(let existTag of existTags){
            existTagNamesMap[existTag.tagName] = existTag._id;
        }

        let groupedTargetApis = _.groupBy(content.apis, 'tag_oid');

        let groupedTargetTags = _.groupBy(content.tags, '_id');

        let tagMappedApis = {};
        let noTagApis = [];

        for(let tag_id in groupedTargetApis){
            let groupedApis = groupedTargetApis[tag_id];
            for(let item of groupedApis){
                let tagName = groupedTargetTags[tag_id]?groupedTargetTags[tag_id][0].tagName: null;
                let type = item.type;
                //如果tagName已存在，则替换需要导入项目的tag_oid
                if(existTagNamesMap[tagName]){
                    item.tag_oid = existTagNamesMap[tagName];
                }
                delete item._id;
                if(tagName){
                    tagMappedApis[type?(tagName+'-'+type):tagName] = item
                }else{
                    noTagApis.push(item)
                }
            }
        }

        let currentApis = await model.ApiConfig.find({
            app_oid: ObjectId(app_id),
            tag_oid: {
                "$exists": true
            }
        }).populate('tag_oid').lean();

        let tagMappedCurrentApis = _.groupBy(currentApis, (item)=>{
            let tagName = _.get(item, 'tag_oid.tagName');
            let type = item.type;
            if(tagName){
                if(type){
                    return tagName + '-' + type;
                }else{
                    return tagName;
                }
            }else{
                return undefined;
            }
        });

        for(let tagName in tagMappedApis){
            tagMappedApis[tagName].tagName = tagName;
            if(tagMappedCurrentApis[tagName]){
                tagMappedApis[tagName].replacedName = tagMappedCurrentApis[tagName][0].name;
            }else{
                noTagApis.push(tagMappedApis[tagName]);
                delete tagMappedApis[tagName];
            }
        }

        let notExistTagsMap = {};
        for(let item of notExistTags){
            notExistTagsMap[item.tagName] = item;
        }

        return {tagMappedApis, tagMappedCurrentApis, noTagApis, notExistTagsMap};
    }

    async importConfigs({app_id, addedTags, addedConfigs, replacedConfigs}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        for(let addedTag of addedTags){
            await model.Tag.findOneAndReplace({
                _id: ObjectId(addedTag._id)
            },
            addedTag,
            {"upsert":true})
        }

        let aInsert = addedConfigs.map(item=>{
            item.app_oid = ObjectId(app_id);
            return item
        })

        replacedConfigs.map(async replacedConfig=>{
            await model.ApiConfig.findOneAndReplace(
                {app_oid:ObjectId(app_id),tagName:replacedConfig.tagName},
                replacedConfig,
                {"upsert":true}
            );
        })

        await model.ApiConfig.insertMany(aInsert);

        return true;
    }

    async exportGroupItems({group_id}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        const items = await model.ApiGroupItem.find({
            apiGroup_oid: ObjectId(group_id)
        }).lean();

        items.forEach(item=>{
            delete item.apiGroup_oid;
        })

        let tag_oids = items.map(item=>item.tag_oid);

        const tags = await model.Tag.find({
            _id: {
                "$in": tag_oids
            }
        }).lean();

        return {
            items,
            tags
        };
    }
}

module.exports = BackupService;
