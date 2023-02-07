'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    itemStatisticsRule: {
        query: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            tag_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    templateStatisticsRule: {
        query: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class StatisticsController extends Controller {
    /**
     * 模板成员调用统计，成功失败比例，ttf统计
     */
    async itemStatistics(){
        const { ctx, logger } = this;
        try{
            ctx.helper.validate(Rules.itemStatisticsRule);
            const {
                apiTemplate_id,
                tag_id
            } = ctx.query;
            const {statistics, success, fail, name, ttf} = await ctx.service.statistics.item
            .getTemplateStatistics({
                apiTemplate_id, 
                tag_id
            });
            ctx.body = {
                result: true,
                statistics,
                success,
                fail,
                name,
                ttf
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    /**
     * 厂商各api模板调用情况统计，模板失败调用数统计
     */
    async templateStatistics(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.templateStatisticsRule);
            const {apiTemplate_id} = ctx.query;
            const {statistics, failStatistics, successStatistics} = await ctx.service.statistics.template
            .statisticsOfTemplates(
                {
                    apiTemplate_id
                }
            )
            ctx.body = {
                result: true,
                statistics,
                failStatistics,
                successStatistics
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async generalStatistics(){
        const { ctx, logger } = this;
        try {
            const {timesStatistics, failStatistics, successStatistics, companyStatistics} = await ctx.service.statistics.general
            .statisticsOfGemeral();
            const recent10Fails = await ctx.service.statistics.item
            .getRecentFails({user_id: ctx.request.userInfo._id, isAdmin:ctx.request.userInfo.isAdmin});

            const failHeatmap = await ctx.service.statistics.item
            .getFailHeatmap({user_id: ctx.request.userInfo._id, isAdmin:ctx.request.userInfo.isAdmin});
            
            ctx.body = {
                result: true,
                timesStatistics,
                failStatistics, 
                successStatistics, 
                companyStatistics,
                failHeatmap,
                recent10Fails
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
}

module.exports = StatisticsController;
