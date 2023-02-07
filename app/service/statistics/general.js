
/**
 * 全局视角统计
 */
const Service = require('egg').Service;

class GeneralStatisticsService extends Service {
    async statisticsOfGemeral(){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        //接口总调用次数统计
        let match = {
            tag_oid: {
                "$exists": true
            }
        }

        let timesAggregation = [
            {
                "$match": match
            },
            {
                "$group":{
                    "_id": {
                        "template": "$apiTemplate_oid",
                        "tag": "$tag_oid"
                    },
                    "count": {
                        "$sum": 1
                    },
                    "app_oid": {
                        "$first": "$app_oid"
                    },
                    "api_oid": {
                        "$first": "$api_oid"
                    },
                    "success": {
                        "$sum": {
                            "$cond": {
                                if: { "$eq": [ "$callResult.success", true]},
                                then: 1,
                                else: 0
                            }
                        }
                    },
                    "fail": {
                        "$sum": {
                            "$cond": {
                                if: { "$eq": [ "$callResult.success", false]},
                                then: -1,
                                else: 0
                            }
                        }
                    }
                }
            },
            {
                "$lookup": {
                    from: 'tags',
                    localField: '_id.tag',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                "$lookup": {
                    from: 'apitemplates',
                    localField: '_id.template',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                "$unwind": "$tag"
            },
            {
                "$unwind": "$template"
            },
            {
                "$sort": {
                    count: -1
                }
            }
        ]

        let timesStatistics = await model.ApiLog.aggregate(timesAggregation);

        //接口失败数统计
        match["callResult.success"] = false;

        let failAggregation = [
            {
                "$match": match
            },
            {
                "$group":{
                    "_id": {
                        "template": "$apiTemplate_oid",
                        "tag": "$tag_oid"
                    },
                    "app_oid": {
                        "$first":"$app_oid"
                    },
                    "api_oid": {
                        "$first":"$api_oid"
                    },
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$lookup": {
                    from: 'tags',
                    localField: '_id.tag',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                "$lookup": {
                    from: 'apitemplates',
                    localField: '_id.template',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                "$unwind": "$tag"
            },
            {
                "$unwind": "$template"
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
                    "_id": {
                        "template": "$apiTemplate_oid",
                        "tag": "$tag_oid"
                    },
                    "ttf": {
                        "$avg": "$totalTime"
                    }
                }
            },
            {
                "$lookup": {
                    from: 'tags',
                    localField: '_id.tag',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                "$lookup": {
                    from: 'apitemplates',
                    localField: '_id.template',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                "$unwind": "$tag"
            },
            {
                "$unwind": "$template"
            },
            {
                "$sort": {
                    ttf: -1
                }
            }
        ]

        let successStatistics = await model.ApiLog.aggregate(successAggregation);

        //厂商应用医院数
        let companyMatch = {
            apiTemplate_oid: {
                "$exists": true
            }
        }

        let companyAggregation = [
            {
                "$match": companyMatch
            },
            {
                "$lookup": {
                    from: 'appconfigs',
                    localField: 'app_oid',
                    foreignField: '_id',
                    as: 'app'
                }
            },
            {
                "$unwind": "$app"
            },
            {
                "$group": {
                    "_id": {
                        "company": "$app.company_oid",
                        "template": "$apiTemplate_oid"
                    }
                }
            },
            {
                "$group":{
                    "_id": "$_id.template",
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$lookup": {
                    from: 'apitemplates',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'template'
                }
            },
            {
                "$unwind": "$template"
            },
            {
                "$lookup": {
                    from: 'apitemplateitems',
                    localField: '_id',
                    foreignField: 'apiTemplate_oid',
                    as: 'items'
                }
            },
            {
                "$sort": {
                    count: -1
                }
            }
        ]

        let companyStatistics = await model.ApiConfig.aggregate(companyAggregation);

        return {timesStatistics, failStatistics, successStatistics, companyStatistics}
    }
}

module.exports = GeneralStatisticsService;