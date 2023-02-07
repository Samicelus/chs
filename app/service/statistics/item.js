
/**
 * 模板成员视角统计
 */
const Service = require('egg').Service;

class ItemStatisticsService extends Service {
    async getTemplateStatistics({apiTemplate_id, tag_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let match = {
            apiTemplate_oid: ObjectId(apiTemplate_id),
            tag_oid: ObjectId(tag_id)
        }

        let apiTemplateItem = await model.ApiTemplateItem.findOne(match).lean();

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
                  "app_oid": {
                    "$first": "$app_oid"
                  },
                  "api_oid": {
                    "$first": "$api_oid"
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
        ]

        let statistics = await model.ApiLog.aggregate(aggregation);

        let success = await model.ApiLog.count({...match, "callResult.success":true});
        let fail = await model.ApiLog.count({...match, "callResult.success":false});

        match.totalTime = {"$exists": true};
        let ttf = await model.ApiLog.find(match).select(`log_time totalTime api_oid app_oid`).sort({"log_time":1}).lean();

        return {statistics, success, fail, name: apiTemplateItem.name, ttf};
    }

    async getFailHeatmap({user_id, isAdmin}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        let match = {};
        if(!isAdmin){
            const userScope = await model.ConsultUserScope.findOne({
                user_oid: ObjectId(user_id)
            }).select('scope');
            const scope = userScope?userScope.scope:[];
            match.company_oid = {
                "$in": scope
            }
        }

        const app_oids = await model.AppConfig.distinct('_id', match);

        let aggregation = [
            {
                "$match": {
                    app_oid: {
                        "$in": app_oids
                    },
                    'callResult.success': false
                }
            },
            {
                "$addFields":{
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
                    "$substr": ["$log_time", 0, 10]
                  },
                  "fail": {
                    "$sum": "$fail"
                  },
                  "log_time": {
                      "$first": "$log_time"
                  }
                }
            },
            {
                "$sort":{
                    "log_time": -1
                }
            }
        ];
        let statistics = await model.ApiLog.aggregate(aggregation);
        return statistics;
    }

    async getRecentFails({user_id, isAdmin}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        let condition = {};
        if(!isAdmin){
            const userScope = await model.ConsultUserScope.findOne({
                user_oid: ObjectId(user_id)
            }).select('scope');
            const scope = userScope?userScope.scope:[];
            condition.company_oid = {
                "$in": scope
            }
        }

        const app_oids = await model.AppConfig.distinct('_id', condition);

        const list = await model.ApiLog.find({
            app_oid: {
                "$in": app_oids
            },
            'callResult.success': false
        }).populate({
            path: 'api_oid',
            select: 'name'
        }).populate({
            path: 'app_oid',
            select: 'company_oid name',
            populate: {
                path: 'company_oid',
                select: 'company_name'
            }
        }).populate({
            path: 'tag_oid',
            select: 'tagName description'
        }).populate({
            path: 'apiTemplate_oid',
            select: 'templateName'
        }).select('api_oid app_oid tag_oid apiTemplate_oid log_time callResult')
        .sort({log_time:-1})
        .limit(10)
        .lean();

        return list;
    }
}

module.exports = ItemStatisticsService;