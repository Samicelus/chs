'use strict';

const Service = require('egg').Service;
const moment = require('moment');
moment.locales('zh-cn');
class IflowLogService extends Service {
    async getIflowLog({search, threshold, hideSuccess, hideFail, page, pageSize}) {
        const {ctx:{model, helper},logger, app:{mongoose: {Types: {ObjectId}}}} = this;
        
        let condition = {};
        let searchPatterns = []
        if(search){
            searchPatterns = search.trim().split(/\s+/);
        }

        if(Array.isArray(searchPatterns) && searchPatterns.length){
            let smartapp_oids = await model.SmartApp.distinct('_id', {
                "$or": searchPatterns.map(item=>{
                    return {
                        name: {
                            "$regex": item
                        }
                    }
                })
            });
            let company_oids = await model.Company.distinct('_id', {
                "$or": searchPatterns.map(item=>{
                    return {
                        company_name: {
                            "$regex": item
                        }
                    }
                })
            });
            let user_oids = await model.User.distinct('_id', {
                "$or": searchPatterns.map(item=>{
                    return {
                        nickname: {
                            "$regex": item
                        }
                    }
                })
            })

            if(company_oids.length || smartapp_oids.length || user_oids.length){
                if(company_oids.length){
                    condition["company_oid"] = {"$in": company_oids}
                }
                if(smartapp_oids.length){
                    condition["smartApp_oid"] = {"$in": smartapp_oids}
                }
                if(user_oids.length){
                    condition["handler_oid"] = {"$in": user_oids}
                }
            }else{
                return {list:[], count:0};
            }
        }
        
        if(threshold){
            condition.totalTime = {"$gt": threshold}
        }
        if(hideSuccess && !hideFail){
            condition["iflowResult.success"] = false;
        }else if(!hideSuccess && hideFail){
            condition["iflowResult.success"] = true;
        }

        let list = await model.IflowLog.find(condition)
        .sort({
            created: -1
        })
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .populate({
            path: 'smartApp_oid',
            select: 'name',
        })
        .populate({
            path: 'iflow_oid',
            select: 'user_list nickname title current_step_name'
        })
        .populate({
            path: 'company_oid',
            select: 'company_name'
        })
        .populate({
            path: 'nextStep_oid',
            select: 'step_name'
        })
        .populate({
            path: 'handler_oid',
            select: 'nickname'
        })
        .lean();
        let count = await model.IflowLog.count(condition);
        return {list, count};
    }

    async getIflowLogGroup({search, hideSuccess, hideFail, page, pageSize}) {
        const {ctx:{model, helper},logger, app:{mongoose: {Types: {ObjectId}}}} = this;

        let iflow_oids, count, beginTime;

        let beginLog = await model.IflowLog.find({}).sort({
            created: 1
        }).limit(1).lean();

        if(beginLog.length){
            beginTime = beginLog[0].created;
        }

        if(search){
            let keywords = search.trim().split(/\s+/);
            let smartapp_oids = await model.SmartApp.distinct('_id', {
                name: {
                    "$in": keywords
                }
            });

            let company_oids = await model.Company.distinct('_id', {
                company_name: {
                    "$in": keywords
                }
            });

            let searchCondition = {
                "$or":[
                    {
                        company_id: {
                            "$in": company_oids.map(item=>item.toString())
                        }
                    },
                    {
                        app_id: {
                            "$in": smartapp_oids.map(item=>item.toString())
                        }
                    },
                    {
                        nickname: {
                            "$in": keywords
                        }
                    },
                    {
                        title: {
                            "$in": keywords
                        }
                    },
                    {
                        current_step_name: {
                            "$in": keywords
                        }
                    }
                ]
            }

            if(beginTime){
                searchCondition.created = {"$gte": beginTime}
            }

            let iflows = await model.Iflow.find(searchCondition)
            .sort({
                created: -1
            })
            .skip((Number(page)-1)*Number(pageSize))
            .limit(Number(pageSize))
            .select('_id')
            .lean();

            count = await model.Iflow.count(searchCondition);

            iflow_oids = iflows.map(item=>item._id);
        }else{
            let condition = {
                created: {"$gte": beginTime}
            }

            let iflows = await model.Iflow.find(condition)
            .sort({
                created: -1
            })
            .skip((Number(page)-1)*Number(pageSize))
            .limit(Number(pageSize))
            .select('_id')
            .lean();

            count = await model.Iflow.count(condition);

            iflow_oids = iflows.map(item=>item._id);
        }

        let list = [];

        return {list, count}
    }

    async clearExpireIflowLog(clearMonth = 3){
        const {ctx: { model , logger}, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;
        let removeCondition = {
            created: {"$lte": new moment().subtract(clearMonth, 'month').format('YYYY-MM-DD HH:mm:ss')}
        }
        let res = await model.IflowLog.remove(removeCondition);
        return {removeCondition, res};
    }
}

module.exports = IflowLogService;
