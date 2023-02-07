
/**
 * 厂商视角统计
 */
const Service = require('egg').Service;

class TemplateStatisticsService extends Service {
    async statisticsOfTemplates({apiTemplate_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        //各tag接口调用统计
        let match = {
            apiTemplate_oid: ObjectId(apiTemplate_id),
            tag_oid: {
                "$exists": true
            }
        }
        let aggregation = [
            {
                "$match": match
            },
            {
                "$group":{
                    "_id": "$tag_oid",
                    "app_oid": {
                        "$first": "$app_oid"
                    },
                    "api_oid": {
                        "$first": "$api_oid"
                    },
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$lookup": {
                    from: 'tags',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                "$unwind": "$tag"
            },
            {
                "$sort": {
                    count: -1
                }
            }
        ]

        let statistics = await model.ApiLog.aggregate(aggregation);

        //接口失败数统计
        match["callResult.success"] = false;
        let failAggregation = [
            {
                "$match": match
            },
            {
                "$group":{
                    "_id": "$tag_oid",
                    "app_oid": {
                        "$first": "$app_oid"
                    },
                    "api_oid": {
                        "$first": "$api_oid"
                    },
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$lookup": {
                    from: 'tags',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                "$unwind": "$tag"
            },
            {
                "$sort": {
                    count: -1
                }
            }
        ]

        let failStatistics = await model.ApiLog.aggregate(failAggregation);

        //成功接口平均ttf统计
        match["callResult.success"] = true;
        match["totalTime"] = {
            "$exists": true
        }

        let successAggregation = [
            {
                "$match": match
            },
            {
                "$group":{
                    "_id": "$tag_oid",
                    "app_oid": {
                        "$first": "$app_oid"
                    },
                    "api_oid": {
                        "$first": "$api_oid"
                    },
                    "ttf": {
                        "$avg": "$totalTime"
                    }
                }
            },
            {
                "$lookup": {
                    from: 'tags',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                "$unwind": "$tag"
            },
            {
                "$sort": {
                    ttf: -1
                }
            }
        ]

        let successStatistics = await model.ApiLog.aggregate(successAggregation);

        return {statistics, failStatistics, successStatistics}
    }
}

module.exports = TemplateStatisticsService;