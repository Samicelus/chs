'use strict';
const moment = require('moment');
moment.locales('zh-cn');
// app/service/user.js
const Service = require('egg').Service;

class QyService extends Service {
    async jssdkSign({app_id}) {
        const {ctx: { headers:{referer}, helper, service:{api} }} = this;
        const {ticket} = await api.callConfigedApi({
            app_id,
            apiName: '获取jsapi_ticket',
            params: {}
        })
        const timestamp = new Date().getTime();
        const nonceStr = helper.sha1(`consult_${timestamp}`);

        let string1 = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${referer}`;

        let sign = helper.sha1(string1);
        return {
            jsapi_ticket: ticket,
            nonceStr,
            timestamp,
            url: referer,
            signature: sign
        }
    }

    async getCorpId({app_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let appConfig = await model.AppConfig.findById(app_id).populate('company_oid').select('company_oid').lean();
        let corpId = appConfig.company_oid.weixinqy?appConfig.company_oid.weixinqy.corpId:'';
        return corpId;
    }

    async setAlertBot({app_id, webhook, mentioned_list}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        await model.AppConfig.findByIdAndUpdate(app_id,
            {
                "$set":{
                    "qywechat.alertBot.webhook": webhook,
                    "qywechat.alertBot.mentioned_list": mentioned_list
                }
            });
        return true;
    }

    async alertBug({app_id, api_id, message}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let appConfig = await model.AppConfig.findById(app_id).populate({
            path:'company_oid',
            select: '_id company_name',
            model: model.Company
        }).lean();
        if(appConfig.qywechat && appConfig.qywechat.alertBot && appConfig.qywechat.alertBot.webhook){
            let url = appConfig.qywechat.alertBot.webhook;
            let mentioned_list = appConfig.qywechat.alertBot.mentioned_list;
            let time = moment().format('YYYY-MM-DD HH:mm:ss');
            let apiConfig = await model.ApiConfig.findById(api_id).select('name').lean();
            
            let companyDesc = "";
            if(appConfig.company){
                companyDesc = `${appConfig.company.hospitalName}(${appConfig.company.hospitalId})`
            }else if(appConfig.company_oid){
                companyDesc = `${appConfig.company_oid._id}(${appConfig.company_oid.company_name})`
            }

            let data = {
                "msgtype": "text",
                "text": {
                    "content": `[${time} ${companyDesc}] 接口: ${apiConfig.name} 调用发生错误， 错误信息: ${message}`,
                    "mentioned_list": (mentioned_list && mentioned_list.length>0) ? mentioned_list : []
                }
            }
            await this.ctx.curl(url,
                {
                    method: 'POST',
                    data,
                    headers: {
                        'content-type': 'application/json; charset=UTF-8'
                    },
                    dataType: 'json'
                }
            )
            return true;
        }else{
            return false;
        }
    }
}

module.exports = QyService;
