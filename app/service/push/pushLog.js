'use strict';

const Service = require('egg').Service;

class PushLogService extends Service {
    async getPushLog({search, startTime, endTime, threshold, hideSuccess, hideFail, page, pageSize}) {
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

            let senderCondition = {}

            if(smartapp_oids.length || company_oids.length){
                if(smartapp_oids.length){
                    senderCondition.smartapp_oid = {"$in": smartapp_oids}
                }

                if(company_oids.length){
                    senderCondition.company_oid = {"$in": company_oids}
                }

                let sender_oids = await model.Sender.distinct('_id', senderCondition);

                condition.sender_oid = {
                    "$in": sender_oids
                }
            }else{
                condition.sender_oid = {
                    "$in": []
                }
            }
        }

        if(threshold){
            condition.totalTime = {"$gt": threshold}
        }
        if(hideSuccess && !hideFail){
            condition["pushResult.success"] = false;
        }else if(!hideSuccess && hideFail){
            condition["pushResult.success"] = true;
        }
        if (startTime && endTime) {
            condition.log_time = {$gte: startTime, $lte: endTime};
        }

        let list = await model.PushLog.find(condition)
        .sort({
            log_time: -1
        })
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .populate({
            path: 'sender_oid',
            select: 'company_oid smartapp_oid msgtype detail_oid tried succeeded',
            populate: {
                path: 'company_oid'
            }
        })
        .populate({
            path: 'sender_oid',
            select: 'company_oid smartapp_oid msgtype detail_oid tried succeeded',
            populate: {
                path: 'smartapp_oid'
            }
        })
        .lean();
        let count = await model.PushLog.count(condition);
        return {list, count};
    }

    /**
     * 对推送日志中失败的情况进行重推
     * @param {String} message_id    加入推送队列的消息id
     */
    async resendFail({message_id}){
        const {app:{redis}} = this;
        await redis.lpush('messages', message_id);
    }
}

module.exports = PushLogService;
