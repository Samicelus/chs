'use strict';

// app/service/user.js
const Service = require('egg').Service;
const moment = require('moment');
moment.locales('zh-cn');
class ApilogRotateService extends Service {

    /**
     * 接口日志截取 （背景：接口日志表达到了4G+，数据条目超过300w条，为了节约性能，开启该功能）
     * @param {String} api_id       接口配置id
     * @param {Number} limit        单个接口日志的最大存储条数
     * @returns 
     */
    async apilogRotate({api_id, limit}) {
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;
        let count = await model.ApiLog.count({
            api_oid: ObjectId(api_id)
        });
        if(count > limit){
            await this.ctx.service.apilog.apilogRotate.clearApiLog({api_id, limit});
        }
        return true;
    }

    /**
     * 清理超过目标数量的接口日志
     * @param {String} api_id       接口配置id
     * @param {Number} limit        单个接口日志的最大存储条数
     */
    async clearApiLog({api_id, limit}){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;
        let lastLog = (await model.ApiLog.find({api_oid: ObjectId(api_id)}).sort({log_time:-1}).skip(limit).limit(1).lean())[0];
        await model.ApiLog.remove({
            api_oid: ObjectId(api_id),
            log_time: {"$lte": lastLog.log_time}
        });
        return true;
    }

    async clearExpireApiLog(clearMonth = 1){
        const {ctx: { model }, logger, app: {mongoose: {Types: { ObjectId }}, _, redis}} = this;
        await model.ApiLog.remove({
            "$or":[
                {log_time: {"$lte": new moment().subtract(clearMonth, 'month').format('YYYY-MM-DD HH:mm:ss')}},
                {api_oid:{"$exists": false }}
            ]
        });
        return true;
    }
    
}

module.exports = ApilogRotateService;
