
/**
 * 医互通日活统计
 */
const moment = require('moment');
moment.locales('zh-cn');
const _ = require('lodash');
const Service = require('egg').Service;

class RdStatService extends Service {
    /**
     * 获取某一天使用医院数量, 访问总数, 自建流程发起量
     * @param {date} 日期 
     */
    async dailyData({date}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let timeFormat = "";
        if(date){
            timeFormat = new moment(date).format('YYYY-MM-DD');
        }else{
            timeFormat = new moment().format('YYYY-MM-DD');
        }

        let hospitalCount = await model.ActivityStat.count({
            "time.format": timeFormat,
            "company_id": {"$exists": true}
        });

        let accessCountObj = await model.ActivityStat.findOne({
            "time.format": timeFormat,
            "company_id": {"$exists": false}
        });

        let accessCount = 0;

        if(accessCountObj) {
            accessCount = accessCountObj.count;
        }

        let condition = {
            created: {"$gte": moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss'), "$lte": moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss')}
        }

        let iflowCount = await model.Iflow.count(condition);

        iflowCount += (await model.PrivateIflow.count(condition));

        return {
            hospitalCount,
            accessCount,
            iflowCount
        }
    }

    /**
     * 每日访问趋势
     * @param {startDate} 起始日期 
     * @param {endDate} 结束日期 
     */
    async dailyActivities({startDate, endDate, company_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        if(!startDate && !endDate){
            startDate = new moment().startOf('week')
            endDate = new moment().endOf('week')
        }

        let condition = {
            "time.format": {
                "$gte": moment(startDate).format('YYYY-MM-DD'),
                "$lte": moment(endDate).format('YYYY-MM-DD')
            }
        }

        if(company_id){
            condition.company_id = company_id
        }else{
            condition.company_id = {
                "$exists": false
            }
        }

        let activities = await model.ActivityStat.find(condition).sort({"time.format":1}).lean();

        return {
            activities: {
                data: activities || [],
                range: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')]
            } 
        }
    }

    /**
     * 平均日活
     * @param {startDate} 起始日期 
     * @param {endDate} 结束日期 
     */
     async averageActivities({startDate, endDate}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let averages = [];

        if(!startDate && !endDate){
            startDate = new moment().startOf('week')
            endDate = new moment().endOf('week')
        }

        let condition = {
            "time.format": {
                "$gte": moment(startDate).format('YYYY-MM-DD'),
                "$lte": moment(endDate).format('YYYY-MM-DD')
            },
            "company_id": {"$exists": true}
        }

        let activities = await model.ActivityStat.find(condition).sort({"time.format":1}).lean();

        if(Array.isArray(activities) && activities.length){

            let grouped = _.groupBy(activities, "company_id");

            let company_oids = Object.keys(grouped).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)}).map(item=>ObjectId(item));

            let privateCompanys = await model.PrivateCompany.find({_id:{"$in": company_oids}}).select('company_name').lean();
            let companys = await model.Company.find({_id:{"$in": company_oids}}).select('company_name').lean();

            let companyMap = {}

            companys = companys.concat(privateCompanys)

            companys.forEach(company=>{
                companyMap[company._id.toString()] = company.company_name;
            })

            for(let company_id in grouped){
                
                let company_activities = grouped[company_id];
                
                let average = _.meanBy(company_activities, "count");
                
                if(companyMap[company_id]){
                    averages.push({
                        company_name: companyMap[company_id],
                        average,
                        company_id
                    })
                }
            }
        }

        return averages
    }


    async rdStat(){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let ret = {}

        let today = new moment().format('YYYY-MM-DD');
        let threeMonthsBefore = new moment().subtract(3, 'month').format('YYYY-MM-DD');

        let generalActivityCondition = {
            "time.format": {"$gte": threeMonthsBefore, "$lte": today},
            "company_id": {"$exists": false}
        }
        
        let generalActivityData = await model.ActivityStat.find(generalActivityCondition).sort({"time.format":1}).lean();

        if(Array.isArray(generalActivityData) && generalActivityData.length){
            ret.generalActivity = {
                data: generalActivityData,
                range: [today, threeMonthsBefore]
            }
        }

        let activityRankCondition = {
            "time.format": today,
            "company_id": {"$exists": true}
        }

        logger.info(activityRankCondition);

        let activityRankData = await model.ActivityStat.find(activityRankCondition).sort({"time.format": -1}).limit(20).lean();

        if(Array.isArray(activityRankData) && activityRankData.length){
            let company_oids = activityRankData.map(item=>ObjectId(item.company_id));

            let companys = await model.Company.find({_id:{"$in": company_oids}}).select('company_name').lean();

            let privateCompanys = await model.PrivateCompany.find({_id:{"$in": company_oids}}).select('company_name').lean();

            companys = companys.concat(privateCompanys);

            let companyMap = {}

            companys.forEach(company=>{
                companyMap[company._id.toString()] = company.company_name;
            })

            activityRankData.forEach(item=>{
                item.company_name = companyMap[item.company_id];
            })

            ret.activityRank = {
                data: activityRankData
            }
        }else{
            ret.activityRank = {
                data: []
            } 
        }

        return ret
    }

    /**
     * 医院日活前十
     * @param {*} param0 
     */
    async activitiesRank({date}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let activityRankCondition = {
            "company_id": {"$exists": true}
        }

        if(date){
            activityRankCondition["time.format"] = moment(date).format('YYYY-MM-DD');
        }else{
            activityRankCondition["time.format"] = moment().format('YYYY-MM-DD');
        }

        let activityRankData = await model.ActivityStat.find(activityRankCondition).sort({"count": -1}).lean();

        if(Array.isArray(activityRankData) && activityRankData.length){
            let company_oids = activityRankData.map(item=>ObjectId(item.company_id));

            let companys = await model.Company.find({_id:{"$in": company_oids}}).select('company_name').lean();

            let privateCompanys = await model.PrivateCompany.find({_id:{"$in": company_oids}}).select('company_name').lean();

            companys = companys.concat(privateCompanys);

            let companyMap = {}

            companys.forEach(company=>{
                companyMap[company._id.toString()] = company.company_name;
            })

            activityRankData.forEach(item=>{
                item.company_name = companyMap[item.company_id];
            })
        }
        
        return activityRankData
    }

    /**
     * 医院日活比例前十
     * @param {*} param0 
     */
    async activitiesRankRate({date}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let activityRankCondition = {
            "company_id": {"$exists": true}
        }

        if(date){
            activityRankCondition["time.format"] = moment(date).format('YYYY-MM-DD');
        }else{
            activityRankCondition["time.format"] = moment().format('YYYY-MM-DD');
        }

        let activityRankData = await model.ActivityStat.find(activityRankCondition).lean();

        if(Array.isArray(activityRankData) && activityRankData.length){
            let company_oids = activityRankData.map(item=>ObjectId(item.company_id));
            let company_ids = activityRankData.map(item=>item.company_id);

            let companys = await model.Company.find({_id:{"$in": company_oids}}).select('company_name').lean();

            let privateCompanys = await model.PrivateCompany.find({_id:{"$in": company_oids}}).select('company_name').lean();

            companys = companys.concat(privateCompanys);

            let companyMap = {}

            companys.forEach(company=>{
                companyMap[company._id.toString()] = company.company_name;
            })

            let company_users = await model.CompanyUser.find({company_id:{"$in": company_ids}}).select('company_id').lean();

            let privateCompany_users = await model.PrivateCompanyUser.find({company_id:{"$in": company_ids}}).select('company_id').lean();

            company_users = company_users.concat(privateCompany_users)

            let grouped = _.groupBy(company_users, (o)=>{
                return o.company_id
            })

            activityRankData.forEach(item=>{
                item.company_name = companyMap[item.company_id];
                if(item.company_id && grouped[item.company_id]){
                    item.total = grouped[item.company_id].length;
                }
                if(item.total){
                    item.rate = item.count / item.total
                }
            })

            activityRankData = _.sortBy(activityRankData, 'rate').reverse();
        }

        return activityRankData;
    }

    /**
     * 自建流程数量变化趋势
     * @param {startDate} 起始日期 
     * @param {endDate} 结束日期 
     */
    async iflowStat({startDate, endDate, company_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        if(!startDate && !endDate){
            startDate = new moment().startOf('week')
            endDate = new moment().endOf('week')
        }

        let condition = {
            "time.format": {
                "$gte": moment(startDate).format('YYYY-MM-DD'),
                "$lte": moment(endDate).format('YYYY-MM-DD')
            }
        }

        if(company_id){
            condition.company_id = company_id
        }else{
            condition.company_id = {
                "$exists": false
            }
        }

        let iflowStat = await model.IflowStat.find(condition).sort({"time.format":1}).lean();

        return {
            iflowStat: {
                data: iflowStat || [],
                range: [moment(startDate).format('YYYY-MM-DD'), moment(endDate).format('YYYY-MM-DD')]
            } 
        }
    }


    /**
     * 医院自建流程数量
     * @param {*} param0 
     */
    async companyIflows({date}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let companyIflowsCondition = {
            "company_id": {"$exists": true}
        }

        if(date){
            companyIflowsCondition["time.format"] = moment(date).format('YYYY-MM-DD');
        }else{
            companyIflowsCondition["time.format"] = moment().format('YYYY-MM-DD');
        }

        let iflowStatData = await model.IflowStat.find(companyIflowsCondition).lean();

        if(Array.isArray(iflowStatData) && iflowStatData.length){
            let company_oids = iflowStatData.map(item=>ObjectId(item.company_id));

            let companys = await model.Company.find({_id:{"$in": company_oids}}).select('company_name').lean();

            let privateCompanys = await model.PrivateCompany.find({_id:{"$in": company_oids}}).select('company_name').lean();

            companys = companys.concat(privateCompanys);

            let companyMap = {}

            companys.forEach(company=>{
                companyMap[company._id.toString()] = company.company_name;
            })

            iflowStatData.forEach(item=>{
                item.company_name = companyMap[item.company_id];
            })
        }

        return iflowStatData
    }

    async iflowCreateStat(company_id){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}, redis}} = this;

        let ret = {
            iflowDaily:{
                data: []
            }
        };

        let yesterday = new moment().subtract(1, 'day').format('YYYY-MM-DD');
        let threeMonthsBefore = new moment().subtract(3, 'month').format('YYYY-MM-DD');

        ret.iflowDaily.range = [yesterday, threeMonthsBefore]

        //读取缓存
        let cachedKey = `iflowCreateStat:${company_id||'total'}`;
        let cached = await redis.get(cachedKey)

        if(cached){
            let cachedTillDate = cached.split('|')[0];
            if(cachedTillDate < yesterday){
                //需要计算
                let startDate = moment(cachedTillDate).add(1, 'day').format('YYYY-MM-DD');
                let endDate = yesterday;
                let resultList = await queryForIflowCreateStat({model, company_id, startDate, endDate});
                let cachedList = JSON.parse(cached.split('|')[1]);
                let splicedList = cachedList.filter(item=>{
                    return item.format >= threeMonthsBefore
                })
                ret.iflowDaily.data = splicedList.concat(resultList);
                //更新缓存数据
                let content = [endDate, JSON.stringify(ret.iflowDaily.data)].join('|');
                await redis.set(cachedKey, content);
            }else{
                //使用缓存
                ret.iflowDaily.data = JSON.parse(cached.split('|')[1]);
            }
        }else{
            let resultList = await queryForIflowCreateStat({model, company_id, startDate:threeMonthsBefore, endDate:yesterday});
            ret.iflowDaily.data = resultList;
            //更新缓存数据
            let content = [yesterday, JSON.stringify(ret.iflowDaily.data)].join('|');
            await redis.set(cachedKey, content);
        }
        
        return ret;
    }

    async iflowCreateRank(){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let list = []

        let condition = {
            created: {
                "$gte": new moment().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss'),
                "$lte": new moment().format('YYYY-MM-DD HH:mm:ss')
            },
            company_id: {
                "$exists": true
            }
        }

        let iflows = await model.Iflow.find(condition).select('company_id').lean();

        let privateIflows = await model.PrivateIflow.find(condition).select('company_id').lean();

        iflows = iflows.concat(privateIflows);

        if(Array.isArray(iflows) && iflows.length){
            let grouped = _.groupBy(iflows, function(o){
                return o.company_id
            })

            let companies = await model.Company.find({"_id":{"$in":Object.keys(grouped).map(item=>ObjectId(item))}}).select('company_name').lean()

            let privateCompanies = await model.PrivateCompany.find({"_id":{"$in":Object.keys(grouped).map(item=>ObjectId(item))}}).select('company_name').lean();

            companies = companies.concat(privateCompanies);

            let companyMap = {}

            for(let company of companies){
                companyMap[company._id] = company.company_name;
            }

            for(let company_id in grouped){
                list.push({
                    company_id,
                    company_name: companyMap[company_id],
                    count: grouped[company_id].length
                })
            }
        }

        list = _.sortBy(list, 'count').reverse()

        return list;
    }
}

async function queryForIflowCreateStat({model, company_id, startDate, endDate}){

    let list = []

    let condition = {
        created: {"$gte": startDate, "$lte": moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss')}
    }

    if(company_id){
        condition.company_id = company_id
    }

    let data = await model.Iflow.find(condition).select('created').lean();
    let privateIflows = await model.PrivateIflow.find(condition).select('created').lean();
    data = data.concat(privateIflows);
    
    if(Array.isArray(data) && data.length){
        let grouped = _.groupBy(data, function(o){
            return o.created.slice(0,10)
        })

        for(let format in grouped){
            list.push({format, count: grouped[format].length})
        }
    }

    return list;
}


function padDate(data, current, end){
    if(current <= end){
        let obj = _.find(data, ["time.format", current])
        if(!obj){
            let nowMoment = moment(current);
            let time = {
                year: nowMoment.year(),
                month: nowMoment.month(),
                week: nowMoment.week(),
                date: nowMoment.date(),
                day: nowMoment.day(),
                format: nowMoment.format('YYYY-MM-DD')
            }
            data.push({
                time,
                count: 0
            })
        }
        return padDate(data, moment(current).add(1, 'day').format('YYYY-MM-DD'), end)
    }else{
        return _.sortBy(data, function(o){
            return o.time.format
        })
    }
}

module.exports = RdStatService;