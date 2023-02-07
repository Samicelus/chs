'use strict';
const path = require('path');
const fs = require('fs');
const {Document, Paragraph, Header, Footer, Media, TextRun, Packer} = require('docx');
const Service = require('egg').Service;

class GroupService extends Service {

    async addApiGroup({groupName, pdfUrl, wordUrl}){
        const {ctx: { model }} = this;

        let obj = {
            groupName
        }

        if(pdfUrl || wordUrl){
            if(!obj.docs){
                obj.docs = {}
            }
            if(pdfUrl){
                obj.docs.pdf = pdfUrl;
            }
            if(wordUrl){
                obj.docs.word = wordUrl;
            }
        }

        let apiGroup = await model.ApiGroup(obj).save();

        return apiGroup;
    }

    async modifyApiGroupName({group_id, groupName}){
        const {ctx: { model }} = this;

        let apiGroup = await model.ApiGroup.findByIdAndUpdate(
            group_id,
            {
                $set: {
                    groupName
                }
            },
            {
                new: true
            }
        );

        return apiGroup;
    }

    async modifyApiGroupDocs({group_id, pdfUrl, wordUrl}){
        const {ctx: { model }} = this;

        let setter = {};

        if(pdfUrl){
            setter["docs.pdf"] = pdfUrl;
        }else{
            setter["docs.pdf"] = {};
        }

        if(wordUrl){
            setter["docs.word"] = wordUrl;
        }else{
            setter["docs.word"] = {};
        }

        let apiGroup = await model.ApiGroup.findByIdAndUpdate(group_id, {
            "$set": setter
        },{
            new: true
        });

        return apiGroup;
    }

    async listApiGroup({search, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }, app: {_, mongoose: {Types: {ObjectId}}}} = this;

        let condition = {};
        
        if(search){
            condition.groupName = {
                "$regex": search
            };
        }

        let sort = {
            "created": -1
        }

        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;  
        }

        let list = await model.ApiGroup.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        for(let apiGroup of list){
            apiGroup.itemCount = await model.ApiGroupItem.count({
                apiGroup_oid: ObjectId(apiGroup._id)
            });
            apiGroup.templates = _.groupBy((await model.ApiTemplate.find({
                apiGroup_oid: ObjectId(apiGroup._id)
            })), 'templateName');
        }

        let count = await model.ApiGroup.count(condition);
        return {list, count};
    }

    async addItemToGroup({apiGroup_id, tag_id, itemName, params, paramsExample={}, returnConfig, returnExample={}}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let apiGroupItem = await model.ApiGroupItem({
            apiGroup_oid: ObjectId(apiGroup_id),
            tag_oid: ObjectId(tag_id),
            itemName,
            params,
            paramsExample,
            return: returnConfig,
            returnExample
        }).save();

        return apiGroupItem;
    }

    async getApiGroupItems({apiGroup_id}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let apiGroupObj = await model.ApiGroup.findById(apiGroup_id).select('groupName').lean();

        let list = await model.ApiGroupItem.find({
            apiGroup_oid: ObjectId(apiGroup_id)
        }).populate('tag_oid').lean();

        return {list, groupName:apiGroupObj.groupName};
    }

    async getItemDetail({apiGroupItem_id}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let apiGroupItem = await model.ApiGroupItem.findById(apiGroupItem_id).lean();

        return apiGroupItem;
    }

    async updateItem({item_id, itemName, tag_id, params, paramsExample, returnConfig, returnExample}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let setter = {};
        if(itemName){
            setter.itemName = itemName;
        }
        if(tag_id){
            setter.tag_oid = ObjectId(tag_id);
        }
        if(params){
            setter.params = params;
        }
        if(paramsExample){
            setter.paramsExample = paramsExample;
        }
        if(returnConfig){
            setter.return = returnConfig;
        }
        if(returnExample){
            setter.returnExample = returnExample;
        }

        let apiGroupItem = await model.ApiGroupItem.findByIdAndUpdate(
            item_id,
            {
                "$set": setter
            }
        )

        return apiGroupItem;
    }

    async getApiTemplateItems({apiTemplate_id}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;
        let list = await model.ApiTemplateItem.find({
            apiTemplate_oid: ObjectId(apiTemplate_id)
        }).populate('tag_oid').lean();

        let callbackList = await model.ApiTemplateCallbackItem.find({
            apiTemplate_oid: ObjectId(apiTemplate_id)
        }).lean();

        return {list, callbackList};
    }

    async addTemplate({apiGroup_id, templateName, version}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let apiTemplate = await model.ApiTemplate({
            apiGroup_oid: ObjectId(apiGroup_id),
            templateName,
            version
        }).save();

        return apiTemplate;
    }

    async spawnTemplateItems({apiTemplate_id, apiGroup_id}){
        const {ctx: { model, helper }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let apiGroupItems = await model.ApiGroupItem.find({
            apiGroup_oid: ObjectId(apiGroup_id)
        }).lean();

        let apiTemplate_oid = ObjectId(apiTemplate_id);
        //过滤掉已存在的tag的模板
        let existsTag_oids = (await model.ApiTemplateItem.distinct('tag_oid',{
            apiTemplate_oid
        })).map(item=>item.toString());

        let templateItems = apiGroupItems.filter((groupItem)=>{
            return !existsTag_oids.includes(groupItem.tag_oid.toString())
        }).map((groupItem)=>{
            return {
                apiTemplate_oid,
                tag_oid: groupItem.tag_oid,
                name: groupItem.itemName,
                data: {},
                dataSource: [],
                dataMerge: {},
                dataType: 'json',
                headers: {},
                pre:{
                    hasPre: false,
                    processReturn: {}
                },
                cache: {
                    isCached: false
                },
                return: helper.validator2ReturnConfig(groupItem.return)
            }
        });
        
        await model.ApiTemplateItem.insertMany(templateItems);
        return true;
    }

    async getTemplateItemDetail({apiTemplateItem_id}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let apiTemplateItem = await model.ApiTemplateItem.findById(apiTemplateItem_id).lean();

        return apiTemplateItem;
    }

    async createApiTemplateItem({apiTemplate_id, item}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        item.apiTemplate_oid = ObjectId(apiTemplate_id);
        return await model.ApiTemplateItem(item).save();
    }

    async createApiTemplateCallbackItem({apiTemplate_id, item}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        item.apiTemplate_oid = ObjectId(apiTemplate_id);
        return await model.ApiTemplateCallbackItem(item).save();
    }

    async updateApiTemplateItem({apiTemplateItem_id, item}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.ApiTemplateItem.findOneAndReplace({_id: ObjectId(apiTemplateItem_id)}, item, {"upsert":true});
    }

    async searchApi({search}){
        const {ctx: { model }, app: { _, mongoose: {Types: { ObjectId }}}} = this;
        
        let tag_oids = await model.Tag.distinct('_id',{
            tagName: {
                "$regex": search
            }
        })

        let app_oids = await model.AppConfig.distinct('_id',{
            name: {
                "$regex": search
            }
        })

        let condition = {
            "$or":[
                {
                    name: {
                        "$regex": search
                    }
                },
                {
                    tag_oid: {
                        "$in": tag_oids
                    }
                },
                {
                    app_oid: {
                        "$in": app_oids
                    }
                }
            ]
        }

        const list = await model.ApiConfig.find(condition)
        .populate({
            path: 'tag_oid',
            select: 'tagName'
        })
        .populate({
            path: 'app_oid',
            select: 'name'
        })
        .select(`_id name tag_oid app_oid`)
        .lean();

        let apis = _.groupBy(list.filter(item=>(item.app_oid && item.app_oid._id)), 'app_oid._id');

        return {list, apis};
    }

    async replaceApi({apiTemplateItem_id, api_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let api = await model.ApiConfig.findById(api_id).lean();

        delete api._id;
        delete api.app_oid;
        delete api.tag_oid;
        delete api.apiTemplate_oid;
        delete api.apiGroup_oid;
        delete api.defaultApi;
        delete api.threshold;
        delete api.created;
        delete api.updated;

        let item = await model.ApiTemplateItem.findByIdAndUpdate(apiTemplateItem_id,{
            "$set": api
        });

        return item;
    }

    async deleteApiTemplateItem({apiTemplateItem_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let deleted = await model.ApiTemplateItem.findByIdAndRemove(apiTemplateItem_id);
        await model.ApiTemplateItemRecycle({
            content: deleted
        }).save();
        return deleted;
    }

    async deleteApiTemplateCallbackItem({apiTemplateCallbackItem_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let deleted = await model.ApiTemplateCallbackItem.findByIdAndRemove(apiTemplateCallbackItem_id);
        return deleted;
    }

    async formStandardDoc({apiGroup_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let list = await model.ApiGroupItem.find({
            apiGroup_oid: ObjectId(apiGroup_id)
        }).populate({
            path: 'apiGroup_oid',
            select: 'groupName'
        }).populate({
            path: 'tag_oid',
            select: 'tagName description'
        }).lean();


        if(Array.isArray(list) && list.length>0){

        }

        let doc = new Document();

        let logo = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../../public/images/logo.png')), 50, 30);
        let front = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../../public/images/EMT.png')), 300, 432);
        
        let stdName = list[0].apiGroup_oid.groupName;

        doc.addSection({
            properties: {},
            headers:{
                default: new Header({
                    children: [new Paragraph(
                        {
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text:`${stdName} 接口文档`,
                                })
                            ]
                        }
                    )]
                }),
                children:[]
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                logo
                            ]
                        }),
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text: '该资料为义幻医疗内部文档，严禁对外公开。',
                                    size: 20,
                                    color: "888888",
                                    italics: true
                                })
                            ]
                        })
                    ]
                }),
                children:[]
            },
            children: [
                new Paragraph({
                    alignment: 'center',
                    children: [
                        new TextRun('').break(),
                        new TextRun('').break(),
                        front
                    ]
                }),
                new Paragraph({
                    alignment: 'center',
                    heading: 'Title',
                    children: [
                        new TextRun(
                            {
                                text: `义幻医疗 第三方接口平台`,
                                bold: true
                            }
                        ).break(),
                        new TextRun(
                            {
                                text: `${stdName} 接口文档`,
                                size: 48,
                                color: 'aaaaaa',
                                underline: {
                                    type: 'single',
                                    color: 'aaaaaa'
                                }
                            }
                        ).break()
                    ]
                })
            ]
        })

        for(let groupItem of list){
            helper.formStandardDoc(groupItem, doc);
        }
        
        let buffer = await Packer.toBuffer(doc);
        return {data: buffer, name: `${stdName} 接口文档`};
    }

    async formTemplateDoc({apiTemplate_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let list = await model.ApiTemplateItem.find({
            apiTemplate_oid: ObjectId(apiTemplate_id)
        }).populate({
            path: 'apiTemplate_oid',
            select: 'templateName apiGroup_oid',
            populate: {
                path: 'apiGroup_oid',
                select: 'groupName'
            }
        }).populate({
            path: 'tag_oid',
            select: 'tagName description'
        }).lean();

        let doc = new Document();

        let logo = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../../public/images/logo.png')), 50, 30);
        let front = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../../public/images/EMT.png')), 300, 432);
        
        let stdName = list[0].apiTemplate_oid.templateName;

        doc.addSection({
            properties: {},
            headers:{
                default: new Header({
                    children: [new Paragraph(
                        {
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text:`${stdName} 接口文档`,
                                })
                            ]
                        }
                    )]
                }),
                children:[]
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                logo
                            ]
                        }),
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text: '该资料为义幻医疗内部文档，严禁对外公开。',
                                    size: 20,
                                    color: "888888",
                                    italics: true
                                })
                            ]
                        })
                    ]
                }),
                children:[]
            },
            children: [
                new Paragraph({
                    alignment: 'center',
                    children: [
                        new TextRun('').break(),
                        new TextRun('').break(),
                        front
                    ]
                }),
                new Paragraph({
                    alignment: 'center',
                    heading: 'Title',
                    children: [
                        new TextRun(
                            {
                                text: `义幻医疗 第三方接口平台`,
                                bold: true
                            }
                        ).break(),
                        new TextRun(
                            {
                                text: `${stdName} 接口文档`,
                                size: 48,
                                color: 'aaaaaa',
                                underline: {
                                    type: 'single',
                                    color: 'aaaaaa'
                                }
                            }
                        ).break()
                    ]
                })
            ]
        })

        for(let templateItem of list){
            helper.formApiDoc(templateItem, doc);
        }
        
        let buffer = await Packer.toBuffer(doc);
        return {data: buffer, name: `${stdName} 接口文档`};
    }

    async getSerialVersions({apiTemplate_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let apiTemplate = await model.ApiTemplate.findById(apiTemplate_id).lean();
        
        let list = await model.ApiTemplate.find({
            templateName: apiTemplate.templateName
        }).select('_id templateName version').lean();
        
        return list;
    }

    async changeVersion({apiTemplate_id, version}){
        const {ctx: { model }} = this;

        let apiTemplate = await model.ApiTemplate.findByIdAndUpdate(apiTemplate_id, {
            "$set": {
                version
            }
        })

        return apiTemplate;
    }
}


module.exports = GroupService;
