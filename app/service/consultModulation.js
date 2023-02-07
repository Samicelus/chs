'use strict';

// app/service/consultModulation.js
const Service = require('egg').Service;
const moment = require('moment');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const soap = require('soap');
const {Document, Paragraph, Header, Footer, Media, TextRun, Packer} = require('docx');

const {CONDITION_TYPE_MAP, KEYEVAL_ELEMENT_MAP, API_FORM_DATA_FROM_MAP ,DOC_MAP, SYSTEM_METHOD_MAP, ENCODE_MAP, SIGNPOSITION_MAP} = require('../../const/module/consult');
const SOURCE_MAP = require('../../const/module/docMaps');
const result = require('../../const/module/docMaps');
const privateCompanies = require('../../const/privateCompanies/companies.js');

class ConsultModulationService extends Service {
    async createAppConfig({name, description, company, company_id}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let appConfigObj = {
            company,
            name,
            description
        }

        if(company_id){
            appConfigObj.company_oid = ObjectId(company_id);
        }

        const appConfig = await model.AppConfig(appConfigObj).save();
        //添加用于测试的医生
        // let doctor = await model.ConsultDoctor.findOne({
        //     company_oid: ObjectId(company_id),
        //     user_oid: ObjectId(this.ctx.request.userInfo._id)
        // });
        // if(!doctor){
        //     await model.ConsultDoctor({
        //         company_oid: ObjectId(company_id),
        //         consultUser_oid: ObjectId(this.ctx.request.userInfo._id),
        //         profile: {
        //             property: 'doctor',
        //             profession: '测试',
        //             sections: '测试',
        //             description: '测试'
        //         },
        //         consultTypes:{
        //             text: {
        //                 isOpen: true,
        //                 isAvailable: true,
        //                 price: 0,
        //                 push: 'immediate'
        //             },
        //         },
        //         hisPower: {
        //             canGiveAdvice: true,
        //             canGiveLab: true,
        //             canGivePicture: true,
        //             canGiveRecord: true
        //         }
        //     }).save();
        // }
        return appConfig;
    }

    async setAppSecret({app_id, secret, agentid}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const result = await model.AppConfig.findByIdAndUpdate(
            app_id,
            {
                "$set": {
                    "qywechat.secret": secret,
                    "qywechat.agentid": agentid
                }
            }
        );
        return result;
    }

    async createModuleConfigs({app_oid, modules}) {
        const {ctx: { model }, app: {_}} = this;
        modules.forEach(element => {
            element.app_oid = app_oid;
            element.actions = _.keyBy(element.actions, function(o){
                return o.key;
            });
        });
        const result = await model.ModuleConfig.insertMany(modules);
        return result;
    }

    async createStatusConfigs({app_oid, status}){
        const {ctx: { model }} = this;
        status.forEach(element => {
            element.app_oid = app_oid;
        });
        const result = await model.StatusConfig.insertMany(status);
        return result;
    }

    async createApiConfigs({app_oid, apis}){
        const {ctx: { model }} = this;
        apis.forEach(element => {
            element.app_oid = app_oid;
        });
        const result = await model.ApiConfig.insertMany(apis);
        return result;
    }

    async createApiFromTemplate({app_id, template_ids}){
        const {ctx: { model }, logger, app: { _, mongoose: {Types: { ObjectId }}}} = this;
        const apiTemplateItems = await model.ApiTemplateItem.find({
            apiTemplate_oid: {
                "$in": template_ids.map(element=>ObjectId(element))
            }
        }).populate({
            path: 'apiTemplate_oid'
        }).lean();

        let existsTags = (await model.ApiConfig.distinct('tag_oid',{
            app_oid: ObjectId(app_id)
        })).map(item=>item.toString());

        let apis = apiTemplateItems.filter((item)=>{
            return !existsTags.includes(item.tag_oid?item.tag_oid.toString():"")
        })
        .map((item)=>{
            item.apiGroup_oid = item.apiTemplate_oid.apiGroup_oid;
            item.apiTemplate_oid = item.apiTemplate_oid._id;
            delete item.created;
            delete item.updated;
            delete item._id;
            item.app_oid = ObjectId(app_id);
            item.defaultApi = true;
            return item;
        })
        const result = await model.ApiConfig.insertMany(apis);
        return result;
    }

    async createCallbackFromTemplate({app_id, template_ids}){
        const {ctx: { model }, logger, app: { _, mongoose: {Types: { ObjectId }}}} = this;
        const apiTemplateCallbackItems = await model.ApiTemplateCallbackItem.find({
            apiTemplate_oid: {
                "$in": template_ids.map(element=>ObjectId(element))
            }
        }).populate({
            path: 'apiTemplate_oid'
        }).lean();

        let existsTags = (await model.CallbackConfig.distinct('callbackTag',{
            app_oid: ObjectId(app_id)
        }));

        let callbacks = apiTemplateCallbackItems.filter((item)=>{
            return !existsTags.includes(item.callbackTag)
        })
        .map((item)=>{
            item.apiGroup_oid = item.apiTemplate_oid.apiGroup_oid;
            item.apiTemplate_oid = item.apiTemplate_oid._id;
            delete item.created;
            delete item.updated;
            delete item._id;
            item.app_oid = ObjectId(app_id);
            return item;
        })
        const result = await model.CallbackConfig.insertMany(callbacks);
        return result;
    }

    async deleteAppConfig({app_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        await model.AppConfig.findByIdAndRemove(app_id);
        await model.ModuleConfig.deleteMany({
            app_oid: ObjectId(app_id)
        });
        await model.StatusConfig.deleteMany({
            app_oid: ObjectId(app_id)
        });
        await model.ApiConfig.deleteMany({
            app_oid: ObjectId(app_id)
        });
        await model.ApiLog.deleteMany({
            app_oid: ObjectId(app_id)
        });
        return true;
    }

    async listAppConfig({userInfo, name, hospitalId, company_id, page, pageSize, sortField, sortOrder, user_id}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let condition = {};

        if(!userInfo.isAdmin){
            //可见范围
            const user_id = userInfo._id;
            const userScope = await model.ConsultUserScope.findOne({
                user_oid: ObjectId(user_id)
            }).select('scope');
            const scope = userScope?userScope.scope:[];

            let javaScope = [];
            let rdScope = [];
            scope.forEach(item=>{
                if(item.hospitalId){
                    if(!hospitalId || hospitalId == item.hospitalId){
                        javaScope.push(item.hospitalId);
                    }
                }
                if(item.company_oid){
                    if(!company_id || company_id == item.company_oid.toString()){
                        rdScope.push(item.company_oid);
                    }
                }
            })

            condition["$or"] = [
                //JAVA组互联网医院的情况
                {
                    "company.hospitalId":  {"$in": javaScope}
                },
                //医互通的情况
                {
                    "company_oid": {"$in": rdScope}
                }
            ]

        }else{
            if(company_id){
                condition["company.hospitalId"] = company_id;
            }
        }


        if(name){
            condition.name = {"$regex": name};
        }
        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }
        const list = await model.AppConfig.find(condition)
        .populate({
            path: 'company_oid',
            select: 'company_name',
            model: model.Company
        })
        .select(`_id name description company qywechat company_oid`)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        if(pageSize<50){
            for(let app of list){
                let exists_apis = await model.ApiConfig.distinct('_id',{
                    app_oid: app._id
                });

                let apiErrorCount = await model.ApiLog.count({
                    app_oid: ObjectId(app._id),
                    'callResult.success': false,
                    'callResult.read': {
                        "$nin": [ObjectId(user_id)]
                    },
                    api_oid: {
                        "$in": exists_apis
                    }
                });

                let callbackErrorCount = await model.CallbackLog.count({
                    app_oid: ObjectId(app._id),
                    'callResult.success': false,
                    'callResult.read': {
                        "$nin": [ObjectId(user_id)]
                    }
                });

                app.errorCount = apiErrorCount + callbackErrorCount;
            }
        }

        let count = await model.AppConfig.count(condition);
        return {list, count};
    }

    async listModuleConfig({name, app_id, page, pageSize, sortField, sortOrder}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
            app_oid: ObjectId(app_id)
        };
        if(name){
            condition.name = {"$regex": name};
        }
        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }
        const list = await model.ModuleConfig.find(condition)
        .select(`_id name key actions app_oid`)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();
        let count = await model.ModuleConfig.count(condition);
        return {list, count};
    }

    async updateModule({module_id, module:moduleObj}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.ModuleConfig.findOneAndReplace({_id: ObjectId(module_id)}, moduleObj);
    }

    async listStatusConfig({name, app_id, page, pageSize, sortField, sortOrder}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
            app_oid: ObjectId(app_id)
        };
        if(name){
            condition.name = {"$regex": name};
        }
        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }
        this.logger.info(JSON.stringify(condition));
        const list = await model.StatusConfig.find(condition)
        .select(`_id name values app_oid`)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();
        let count = await model.StatusConfig.count(condition);
        return {list, count};
    }

    async updateStatus({status_id, status}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const {app_oid, name} = status;
        return await model.StatusConfig.findOneAndReplace({
            "$or":[
                {
                    _id: ObjectId(status_id)
                },
                {
                    app_oid,
                    name
                }
            ]
        }, status, {"upsert":true});
    }

    async listApiConfig({name, app_id, sortField, sortOrder, user_id}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
            app_oid: ObjectId(app_id)
        };
        let callbackCondition = {
            app_oid: ObjectId(app_id)
        };
        if(name){
            condition.name = {"$regex": name};
        }
        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }
        this.logger.info(JSON.stringify(condition));
        const list = await model.ApiConfig.find(condition)
        .populate({
            path: 'tag_oid',
            select: 'description tagName'
        })
        .populate({
            path: 'apiTemplate_oid',
            select: 'templateName'
        })
        .populate({
            path: 'apiGroup_oid',
            select: 'groupName'
        })
        .select(`_id name defaultApi tag_oid apiTemplate_oid apiGroup_oid mockReturn versionTag`)
        .sort(sort)
        .lean();

        let erroredApioids = await model.ApiLog.distinct('api_oid',{
            app_oid: ObjectId(app_id),
            'callResult.success': false,
            'callResult.read': {
                "$nin": [ObjectId(user_id)]
            }
        })

        let erroredApiids = erroredApioids.map(item=>item.toString());

        for(let api of list){
            api.errorCount = await model.ApiLog.count({
                api_oid: api._id,
                'callResult.success': false,
                'callResult.read': {
                    "$nin": [ObjectId(user_id)]
                }
            })
            if(erroredApiids.includes(api._id.toString())){
                api.errorCount = 1;
            }else{
                api.errorCount = 0;
            }
        }

        let count = await model.ApiConfig.count(condition);


        let callbackList = await model.CallbackConfig.find(callbackCondition)
        .populate({
            path: 'apiTemplate_oid',
            select: 'templateName'
        })
        .select(`_id app_oid name callbackUrl callbackTag apiTemplate_oid mock`)
        .sort(sort)
        .lean();

        let outUrl = this.config.outUrl;

        let erroredCallbackoids = await model.CallbackLog.distinct('callbackConfig_oid',{
            app_oid: ObjectId(app_id),
            'callResult.success': false,
            'callResult.read': {
                "$nin": [ObjectId(user_id)]
            }
        });

        let erroredCallbackids = erroredCallbackoids.map(item=>item.toString());

        for(let callback of callbackList){
            callback.errorCount = await model.CallbackLog.count({
                callbackConfig_oid: callback._id,
                'callResult.success': false,
                'callResult.read': {
                    "$nin": [ObjectId(user_id)]
                }
            })
            if(erroredCallbackids.includes(callback._id.toString())){
                callback.errorCount = 1;
            }else{
                callback.errorCount = 0;
            }
            callback.callbackOutUrl = `${outUrl}${callback.callbackTag}/${callback.app_oid}/callback`
        }

        return {list, callbackList, count};
    }

    async getApiDetail({api_id}){
        const {ctx: { model }} = this;
        return await model.ApiConfig.findById(api_id);
    }

    async formApiMD({api_id}){
        const {ctx: {model, helper}} = this;
        const apiConfig = await model.ApiConfig.findById(api_id)
        .populate({
            path: 'app_oid',
            select: 'name company_oid'
        })
        .populate(
            {
                path: 'tag_oid',
                select: 'tagName'
            }
        )
        lean();

        return helper.formApiMD(apiConfig);
    }

    async formApisMD({app_id}){
        const {ctx: {model, helper},logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        const apiConfigs = await model.ApiConfig.find({
            app_oid: ObjectId(app_id)
        })
        .populate({
            path: 'app_oid',
            select: 'name company_oid'
        })
        .populate(
            {
                path: 'tag_oid',
                select: 'tagName'
            }
        )
        .lean();

        return apiConfigs.map(apiConfig=>{
            return helper.formApiMD(apiConfig)
        }).join('\r');
    }

    async formApiDoc({api_id}){
        const {ctx: {model, helper}} = this;
        const apiConfig = await model.ApiConfig.findById(api_id)
        .populate(
            {
                path: 'app_oid',
                select: 'name company_oid'
            }
        )
        .populate(
            {
                path: 'tag_oid',
                select: 'tagName'
            }
        )
        .lean();

        let doc = new Document();

        let logo = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../public/images/logo.png')), 50, 30);
        let front = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../public/images/EMT.png')), 300, 432);

        doc.addSection({
            properties: {},
            headers:{
                default: new Header({
                    children: [new Paragraph(
                        {
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text:`${apiConfig.app_oid.name} 接口文档`,
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
                                text: `${apiConfig.app_oid.name} 接口文档`,
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

        if(apiConfig.tag_oid && apiConfig.tag_oid._id){
            let apiGroupItem = await model.ApiGroupItem.findOne({
                tag_oid: apiConfig.tag_oid._id
            }).lean();
            if(apiGroupItem){
                apiConfig.params = apiGroupItem.params;
            }
        }

        helper.formApiDoc(apiConfig, doc);

        let buffer = await Packer.toBuffer(doc);
        return {data:buffer, name:`${apiConfig.app_oid.name} 接口文档`};
    }

    async formApisDoc({app_id}){
        const {ctx: {model, helper}, app: {mongoose: {Types: { ObjectId }}}} = this;
        const appConfig = await model.AppConfig.findById(app_id).select('name').lean();
        const apiConfigs = await model.ApiConfig.find({
            app_oid: ObjectId(app_id)
        })
        .populate(
            {
                path: 'app_oid',
                select: 'name company_oid'
            }
        )
        .populate(
            {
                path: 'tag_oid',
                select: 'tagName'
            }
        )
        .lean();

        let doc = new Document();

        let logo = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../public/images/logo.png')), 50, 30);
        let front = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../public/images/EMT.png')), 300, 432);

        doc.addSection({
            properties: {},
            headers:{
                default: new Header({
                    children: [new Paragraph(
                        {
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text:`${appConfig.name} 接口文档`,
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
                                text: `${appConfig.name} 接口文档`,
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

        for(let apiConfig of apiConfigs){
            if(apiConfig.tag_oid && apiConfig.tag_oid._id){
                let apiGroupItem = await model.ApiGroupItem.findOne({
                    tag_oid: apiConfig.tag_oid._id
                }).lean();
                if(apiGroupItem){
                    apiConfig.params = apiGroupItem.params;
                }
            }
            helper.formApiDoc(apiConfig, doc);
        }

        let buffer = await Packer.toBuffer(doc);
        return {data: buffer, name: `${appConfig.name} 接口文档`};
    }

    async formApiXLSX({api_id}){
        const {ctx: {model, helper}} = this;
        const apiConfig = await model.ApiConfig.findById(api_id)
        .populate(
            {
                path: 'app_oid',
                select: 'name'
            }
        )
        .lean();

        return {data:helper.formXLSX(apiConfig), name: apiConfig.name};
    }

    async listApiLog({app_id, api_id, search, page, pageSize, sortField="log_time", sortOrder="descend", onlyTimeout, success, user_id}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}, redis}} = this;

        let condition = {
            app_oid: ObjectId(app_id)
        };

        if(onlyTimeout){
            let apiObj = await model.ApiConfig.findById(api_id).select('threshold').lean();
            if(apiObj && apiObj.threshold){
                condition.totalTime = {"$gt": apiObj.threshold};
            }else{
                //如果没设置threshold,而仅显示超过threshold的，则一条也不显示
                condition.totalTime = {"$lt": -1};
            }
        }

        if(success){
            let successMap = {
                "true": true,
                "false": false
            }
            condition['callResult.success'] = {
                "$in": success.split('|').map(item=>successMap[item])
            }
        }

        if(api_id){
            condition.api_oid = ObjectId(api_id);
        }
        if(search){
            condition["$or"] = [];
            condition["$or"].push({
                params: {"$regex": search}
            });
            condition["$or"].push({
                data: {"$regex": search}
            });
            condition["$or"].push({
                result: {"$regex": search}
            });
        }
        let sort = {}
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }

        const list = await model.ApiLog.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        //避免重复查询
        let versionTagMap = {};

        for(let apiLogObj of list){
            if(apiLogObj.versionTag){
                if(versionTagMap[apiLogObj.versionTag]){
                    apiLogObj.versionConfig = versionTagMap[apiLogObj.versionTag]
                }else{
                    let apiConfigHistory = await model.ApiConfigHistory.findOne({
                        api_oid: apiLogObj.api_oid,
                        versionTag: apiLogObj.versionTag
                    }).lean();
                    if(apiConfigHistory){
                        let versionConfig = JSON.stringify(apiConfigHistory.api,null,2);
                        versionTagMap[apiLogObj.versionTag] = versionConfig;
                        apiLogObj.versionConfig = versionConfig;
                    }
                }
            }
        }

        let count = await model.ApiLog.count(condition);
        //标记已读(旧失败日志)
        condition["callResult.read"] = {
            "$nin": [ObjectId(user_id)]
        }
        await model.ApiLog.update(condition,{
            "$push":{
                "callResult.read": ObjectId(user_id)
            }
        },{
            "multi": true
        })

        return {list, count};
    }

    async clearApiLog({api_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        try{
            await model.ApiLog.remove({api_oid: ObjectId(api_id)});
            return {result: true};
        }catch(e){
            return {result: false};
        }
    }

    async listCallbackLog({callback_id, search, page, pageSize, sortField="log_time", sortOrder="descend", success, user_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let condition = {};

        if(success){
            let successMap = {
                "true": true,
                "false": false
            }
            condition['callResult.success'] = {
                "$in": success.split('|').map(item=>successMap[item])
            }
        }

        if(callback_id){
            condition.callbackConfig_oid = ObjectId(callback_id);
        }

        if(search){
            condition["$or"] = [];
            condition["$or"].push({
                requestIp: {"$regex": search}
            });
            condition["$or"].push({
                requestBody: {"$regex": search}
            });
            condition["$or"].push({
                requestHeader: {"$regex": search}
            });
        }
        let sort = {}
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }

        const list = await model.CallbackLog.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .populate({
            path: 'callbackConfig_oid',
            select: 'callbackUrl'
        })
        .lean();
        let count = await model.CallbackLog.count(condition);
        //标记已读(旧失败日志)
        condition["callResult.read"] = {
            "$nin": [ObjectId(user_id)]
        }
        await model.CallbackLog.update(condition,{
            "$push":{
                "callResult.read": ObjectId(user_id)
            }
        },{
            "multi": true
        })

        return {list, count};
    }

    async getApiStatistics({api_id, start, end}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let match = {
            "api_oid": ObjectId(api_id)
        }

        if(start || end){
            match.log_time = {};
            if(start){
                match.log_time["$gte"] = moment(start).format('YYYY-MM-DD HH:mm:ss')
            }
            if(end){
                match.log_time["$lte"] = moment(end).format('YYYY-MM-DD HH:mm:ss')
            }
        }
        //按小时统计数目
        let aggregation = [
            {
                "$match": match
            },
            {
                "$addFields":{
                    "success": {"$cond":
                    [
                        "$callResult.success",
                        1,
                        0
                    ]
                },
                    "fail": {"$cond":
                    [
                        "$callResult.success",
                        0,
                        1
                    ]
                }
                }
            },
            {
                "$group": {
                  "_id": {
                    "$add": [
                      {
                        "$multiply": [
                          {
                            "$year": "$created"
                          },
                          1000000
                        ]
                      },
                      {
                        "$multiply": [
                          {
                            "$month": "$created"
                          },
                          10000
                        ]
                      },
                      {
                        "$multiply": [
                          {
                            "$dayOfMonth": "$created"
                          },
                          100
                        ]
                      },
                      {
                        "$hour": "$created"
                      }
                    ]
                  },
                  "success": {
                    "$sum": "$success"
                  },
                  "fail": {
                    "$sum": "$fail"
                  }
                }
            },
            {
                "$sort":{
                    "_id": -1
                }
            }
        ];

        let apiConfig = await model.ApiConfig.findById(api_id).select('name').lean();
        let name = apiConfig?apiConfig.name:'';
        let statistics = await model.ApiLog.aggregate(aggregation);

        let success = await model.ApiLog.count({...match, "callResult.success":true});
        let fail = await model.ApiLog.count({...match, "callResult.success":false});

        match.totalTime = {"$exists": true};
        let ttf = await model.ApiLog.find(match).select(`log_time totalTime`).sort({"log_time":1}).limit(1000).lean();

        return {statistics, success, fail, name, ttf};
    }

    async createCallback({app_id, callback}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        callback.app_oid = ObjectId(app_id);
        callback.methodConfigs.forEach(function(item){
            item.callApis = item.callApis.filter(function(item_1){
                if(item_1) return true
                else return false
            }).map(item_1 => ObjectId(item_1))

            if(item.asReturn) item.asReturn = ObjectId(item.asReturn)
            else delete item.asReturn
        })

        return await model.CallbackConfig(callback).save();
    }

    async updateCallback({callback_id, callback}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this
        callback.methodConfigs.forEach(function(item){
            item.callApis = item.callApis.filter(function(item_1){
                if(item_1) return true
                else return false
            }).map(item_1 => ObjectId(item_1))

            if(item.asReturn) item.asReturn = ObjectId(item.asReturn)
            else delete item.asReturn
        })

        return await model.CallbackConfig.findByIdAndUpdate(callback_id,{
            "$set": {
                name: callback.name,
                callbackUrl: callback.callbackUrl,
                callbackTag: callback.callbackTag,
                mock: callback.mock,
                methodConfigs: callback.methodConfigs
            }
        })
    }

    async getCallbackDetail({callback_id}){
        const {ctx: { model }} = this;
        return await model.CallbackConfig.findById(callback_id);
    }

    async deleteCallback({callback_id}){
        const {ctx: { model }} = this;
        return await model.CallbackConfig.findByIdAndRemove(callback_id);
    }

    async createApi({app_id, api}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        api.app_oid = ObjectId(app_id);
        api.defaultApi = false;
        let apiObj = await model.ApiConfig(api).save();
        const versionTag = `${new moment().format('YYYYMMDDHHmmss')}-${_.padStart(Math.floor(Math.random()*1000),4,'0')}`;
        await model.ApiConfigHistory({
            api_oid: apiObj._id,
            api,
            versionTag
        }).save();
        apiObj.versionTag = versionTag;
        await apiObj.save();
        return apiObj;
    }

    async copyApi({api_id, newName}){
        const {ctx: { model }} = this;
        const originApi = await model.ApiConfig.findById(api_id).lean();
        let newApi = _.cloneDeep(originApi);
        newApi.name = newName;
        delete newApi._id;
        delete newApi.tag_oid;
        const result = await model.ApiConfig(newApi).save();
        const versionTag = `${new moment().format('YYYYMMDDHHmmss')}-${_.padStart(Math.floor(Math.random()*1000),4,'0')}`;
        await model.ApiConfigHistory({
            api_oid: result._id,
            api: newApi,
            versionTag
        }).save();
        result.versionTag = versionTag;
        await result.save();
        return result;
    }

    async updateApi({api_id, api}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const versionTag = `${new moment().format('YYYYMMDDHHmmss')}-${_.padStart(Math.floor(Math.random()*1000),4,'0')}`;
        await model.ApiConfigHistory({
            api_oid: ObjectId(api_id),
            api,
            versionTag
        }).save();
        let apiObj = await model.ApiConfig.findOneAndReplace({_id: ObjectId(api_id)}, api, {"upsert":true});
        apiObj.versionTag = versionTag;
        await apiObj.save();
        return apiObj;
    }

    async flashCache({key}){
        const {app: {redis}} = this;
        let result = await redis.del(key);
        return result;
    }

    async deleteApi({api_id}){
        const {ctx: { model }} = this;
        return await model.ApiConfig.findByIdAndRemove(api_id);
    }

    async adjustApiGroup({api_id, apiGroup_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.ApiConfig.findByIdAndUpdate(api_id,{
            "$set": {
                apiGroup_oid: ObjectId(apiGroup_id)
            }
        },
        {
            new: true
        }
        );
    }

    async getCustomizeConfig({app_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.ConsultCustomizeConfig.findOne({
            app_oid: ObjectId(app_id)
        }).lean();
    }

    async updateCustomizeConfig({app_id, config}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.ConsultCustomizeConfig.findOneAndReplace({
            app_oid: ObjectId(app_id)
        },
        config,
        {"upsert":true});
    }

    async getCompanies({userInfo}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        let scope;

        // if(!userInfo.isAdmin){
        //     //可见范围
        //     const user_id = userInfo._id;
        //     const userScope = await model.ConsultUserScope.findOne({
        //         user_oid: ObjectId(user_id)
        //     }).select('scope');
        //     scope = userScope?userScope.scope:[];
        // }

        logger.info(`当前环境：${process.env.EGG_SERVER_ENV}`)
        if (["prod", "sit"].includes(process.env.EGG_SERVER_ENV)){
            let omsUrl = this.config.omsUrl;

            let url = `${omsUrl}hospital/companyList`;

            let callRes = (await this.ctx.curl(url,
                {
                    method:'GET',
                    dataType: 'json'
                }
            ));

            let result = callRes.data;

            if(result.success && result.code == 200){
                if(!userInfo.isAdmin){
                    return result.data.list.filter(item=>{
                        return scope.map(item=>item.hospitalId).includes(item.hospitalId);
                    })
                }else{
                    result.data.list.push({type:2, name: '私有部署医院列表', list: privateCompanies});
                    return result.data.list;
                }
            }else{
                return [{type:2, name: '私有部署医院列表', list: privateCompanies}];
            }
        }else{
             //rd内部使用环境，读取company表
             let companyCondition = {};
             let scopedPrivateCompanies = privateCompanies;
             // if(!userInfo.isAdmin && scope){
             //     companyCondition._id = {
             //         "$in": scope.map(item=>item.company_oid)
             //     }
             //     scopedPrivateCompanies = scopedPrivateCompanies.filter(item=>scope.map(item=>item.company_oid.toString()).includes(item._id));
             // }
             let companies = await model.Company.find(companyCondition).select('_id company_name company_logo').lean();

             return [{type:1, name: '医互通医院列表', list: companies},{type:2, name: '私有部署医院列表', list: scopedPrivateCompanies}];
        }
    }

    async getConditionTypeMap(){
        return CONDITION_TYPE_MAP;
    }

    async getKeyEvalElementMap(){
        return KEYEVAL_ELEMENT_MAP;
    }

    async getDocMap(){
        return DOC_MAP;
    }

    async getSourceMap() {
        return SOURCE_MAP;
    }

    async getFromMap(){
        return API_FORM_DATA_FROM_MAP;
    }

    async getSystemMethod(){
        return SYSTEM_METHOD_MAP;
    }

    async getEncodeMap(){
        return ENCODE_MAP;
    }

    async getSignPositionMap(){
        return SIGNPOSITION_MAP;
    }

    async searchApiTemplate({search}){
        const {ctx: { model }, app: { _, mongoose: {Types: { ObjectId }}}} = this;

        let group_oids = await model.ApiGroup.distinct('_id',{
            groupName: {
                "$regex": search,
                "$options": "i"
            }
        })

        let condition = {
            "$or": [
                {
                    templateName: {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    apiGroup_oid: {
                        "$in": group_oids
                    }
                }
            ]
        }

        const list = await model.ApiTemplate.find(condition)
        .populate({
            path: 'apiGroup_oid',
            select: 'groupName'
        })
        .select('_id templateName apiGroup_oid version')
        .lean();

        let templates = _.groupBy(list, 'apiGroup_oid._id');

        return {list, templates};
    }

    async getSoapWSDL({url}){
        let client = await soap.createClientAsync(url, {
            endpoint: url
        });
        return {wsdl: client.wsdl, description:client.describe()};
    }

    async fetchAlreadyHost({app_id}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        return model.ApiConfig.distinct('host', {"app_oid":ObjectId(app_id)});
    }
}


function fetchParams(str, regex){
    let replacers = str.match(regex);
    if(replacers && Array.isArray(replacers)){
        return replacers.map(replacer=>replacer.slice(2,-1));
    }else{
        return [];
    }
}

function parseReturn(returnConfig, parentPath=""){
    let params = [];
    for(let key in returnConfig){
        let param = {
            path:parentPath?parentPath+'.'+key:key,
            type: 'Unknown'
        }
        if(returnConfig[key].convert){
            param.type = returnConfig[key].convert.type;
            if(param.type == 'Object'){
                params.push(param);
                if(returnConfig[key].convert.return){
                    params = params.concat(parseReturn(returnConfig[key].convert.return),param.path);
                }
            }else if(param.type == 'Array'){
                param.type += `(${returnConfig[key].convert.itemType})`;
                params.push(param);
                if(returnConfig[key].convert.itemType == 'Object' && returnConfig[key].convert.return){
                    params = params.concat(parseReturn(returnConfig[key].convert.return, param.path+'[x]'));
                }
            }else {
                params.push(param);
            }
        }else{
            params.push(param);
        }
    }
    return params;
}


module.exports = ConsultModulationService;
