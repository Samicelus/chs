/**
 * 同步私有环境组织架构数据
 */
const moment = require('moment');
moment.locales('zh-cn');
const _ = require('lodash');
const Service = require('egg').Service;
const axios = require('axios');

class SyncService extends Service {

    async fetchStruct({company_id}){
        //调用接口平台
        const {ctx: {model, helper, service}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let lastSyncDate = ""

        let record = await model.SyncStructRecord.findOne({company_id}).lean();

        if(record){
            lastSyncDate = record.lastSyncDate
        }

        let callRes = await service.api.callConfigedApi({
            company_id,
            tagName: "syncStruct",
            params:{
                lastSyncDate
            }
        })

        let {companies, company_users, iflows, smartapps, users, group_users, groups} = callRes;

        return {companies, company_users, iflows, smartapps, users, group_users, groups}
    }

    async syncStruct(company_id, {companies, company_users, iflows, smartapps, users, group_users, groups}){
        
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        if(Array.isArray(companies) && companies.length){
            await replaceById(model.PrivateCompany, companies, ObjectId)
        }

        if(Array.isArray(company_users) && company_users.length){
            await replaceById(model.PrivateCompanyUser, company_users, ObjectId)
        }

        if(Array.isArray(iflows) && iflows.length){
            await replaceById(model.PrivateIflow, iflows, ObjectId)
        }

        if(Array.isArray(smartapps) && smartapps.length){
            await replaceById(model.PrivateSmartApp, smartapps, ObjectId)
        }

        if(Array.isArray(users) && users.length){
            await replaceById(model.PrivateUser, users, ObjectId)
        }

        if(Array.isArray(group_users) && group_users.length){
            await replaceById(model.PrivateGroupUser, group_users, ObjectId)
        }

        if(Array.isArray(groups) && groups.length){
            await replaceById(model.PrivateGroup, groups, ObjectId)
        }

        await model.SyncStructRecord.findOneAndUpdate({company_id},{"$set":{lastSyncDate: new moment().format('YYYY-MM-DD')}},{"upsert":true});

        return true;
    }

    async fetchStats({company_id, date}){
        const {ctx: {model, helper, service}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        if(!date){
            date = new moment().format('YYYY-MM-DD');
        }

        let callRes = await service.api.callConfigedApi({
            company_id,
            tagName: "syncStats",
            params:{
                date
            }
        })

        let {access_stats, activity_stats, iflow_stats} = callRes;
        
        return {access_stats, activity_stats, iflow_stats}
    }

    async syncStats(company_id, {access_stats, activity_stats, iflow_stats}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        if(Array.isArray(access_stats) && access_stats.length){
            await replaceById(model.AccessStat, access_stats.filter(item=>!!item.company_id), ObjectId)
        }

        if(Array.isArray(activity_stats) && activity_stats.length){
            await replaceById(model.ActivityStat, activity_stats.filter(item=>!!item.company_id), ObjectId)
        }

        if(Array.isArray(iflow_stats) && iflow_stats.length){
            await replaceById(model.IflowStat, iflow_stats.filter(item=>!!item.company_id), ObjectId)
        }

        return true;
    }
}


async function replaceById(model, data, ObjectId){
    data.forEach(item=>{
        if(item._id){
            item._id = ObjectId(item._id)
        }
    })

    let condition = {
        "_id": {"$in": data.map(item=>item._id)}
    }

    await model.remove(condition);

    await model.insertMany(data);
}

module.exports = SyncService;