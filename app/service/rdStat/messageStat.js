const moment = require('moment');
moment.locales('zh-cn');
const _ = require('lodash');
const Service = require('egg').Service;

class MessageStatService extends Service {

    async messageStat({company_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        let lastHour = new moment().subtract(1, "hour").format("YYYY-MM-DD HH:mm:ss");

        let condition = {
            company_oid: ObjectId(company_id),
            created: {"$gte": lastHour}
        }

        let senders = await model.Sender.find(condition).populate({
            path: "smartapp_oid",
            select: "name type subtype icon_url"
        }).select("smartapp_oid user_oids group_oids party_ids").lean();

        let groupedSenders = _.groupBy(senders, "smartapp_oid._id")


        let list = []

        for(let app_id in groupedSenders){
            let groupedApp = groupedSenders[app_id]
            let pushByApp = {
                count: groupedApp.reduce((total, current)=>{
                    console.log(current)
                    let thisCount = 0;
                    if(current.user_oids){
                        thisCount += Math.ceil(current.user_oids.length/100)
                    }
                    if(current.group_oids){
                        thisCount += Math.ceil(current.group_oids.length/100)
                    }
                    if(current.party_ids){
                        thisCount += Math.ceil(current.party_ids.length/100)
                    }
                    return total + thisCount
                },0),
                app_id,
                appName: groupedApp[0].smartapp_oid.name,
                type: groupedApp[0].smartapp_oid.type,
                subtype: groupedApp[0].smartapp_oid.subtype,
                icon_url: groupedApp[0].smartapp_oid.icon_url
            }
            list.push(pushByApp);
        }

        return list;
    }

}

module.exports = MessageStatService;