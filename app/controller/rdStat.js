'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    messageStatRule: {
        query: {
            company_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class RdStatController extends Controller {
    async dailyData() {
        const { ctx } = this;
        const { date } = ctx.query;
        const result = await ctx.service.rdStat.rdStat.dailyData({date});
        ctx.body = result
    }

    async dailyActivities() {
        const { ctx } = this;
        const { startDate, endDate, company_id} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.dailyActivities({startDate, endDate, company_id});
        ctx.body = result
    }

    async averageActivities() {
        const { ctx } = this;
        const { startDate, endDate} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.averageActivities({startDate, endDate});
        ctx.body = {list: result}
    }

    async rdStat() {
        const { ctx } = this;
        const result = await ctx.service.rdStat.rdStat.rdStat();
        ctx.body = result
    };

    async activitiesRank() {
        const { ctx } = this;
        const { date} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.activitiesRank({date});
        ctx.body = {list: result}
    }

    async activitiesRankRate(){
        const { ctx } = this;
        const { date} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.activitiesRankRate({date});
        ctx.body = {list: result}
    }

    async iflowStat() {
        const { ctx } = this;
        const { startDate, endDate, company_id} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.iflowStat({startDate, endDate, company_id});
        ctx.body = result
    }

    async companyIflows(){
        const { ctx } = this;
        const { date} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.companyIflows({date});
        ctx.body = {list: result}
    }

    async iflowCreateStat(){
        const { ctx } = this;
        const {company_id} = ctx.query;
        const result = await ctx.service.rdStat.rdStat.iflowCreateStat(company_id);
        ctx.body = result
    }

    async iflowCreateRank(){
        const { ctx } = this;
        const list = await ctx.service.rdStat.rdStat.iflowCreateRank();
        ctx.body = {
            list
        }
    }

    async companyDailyData(){
        const { ctx } = this;
        const { date, company_id} = ctx.query;
        const result = await ctx.service.rdStat.accessStat.companyDailyData({date, company_id});
        ctx.body = result
    }

    async appAccess(){
        const { ctx } = this;
        const { startDate, endDate, company_id} = ctx.query;
        const result = await ctx.service.rdStat.accessStat.appAccess({startDate, endDate, company_id});
        ctx.body = result
    }

    async userRank(){
        const { ctx } = this;
        const { startDate, endDate, company_id} = ctx.query;
        const result = await ctx.service.rdStat.accessStat.userRank({startDate, endDate, company_id});
        ctx.body = result
    }

    async groupRank(){
        const { ctx } = this;
        const { startDate, endDate, company_id} = ctx.query;
        const result = await ctx.service.rdStat.accessStat.groupRank({startDate, endDate, company_id});
        ctx.body = result
    }

    async showUserInfo(){
        const { ctx } = this;
        const { user_id, company_id} = ctx.query;
        const result = await ctx.service.rdStat.accessStat.showUserInfo({user_id, company_id});
        ctx.body = result
    }

    async syncStatManual(){
        const { ctx } = this;
        const { date, company_id} = ctx.request.body;

        let result = await ctx.service.rdStat.sync.fetchStats({
            company_id,
            date
        })

        await ctx.service.rdStat.sync.syncStats(company_id, {
            ...result
        })

        ctx.body = {"result": true, "message": "同步统计数据完成"}
    }

    async syncStructManual(){
        const { ctx } = this;
        const { company_id} = ctx.request.body;

        ctx.logger.info(`从 ${company_id} 中 同步组织架构数据...`);

        let result = await ctx.service.rdStat.sync.fetchStruct({
            company_id
        })

        await ctx.service.rdStat.sync.syncStruct(company_id, {
            ...result
        })

        ctx.body = {"result": true, "message": "同步组织架构数据完成"}
    }

    async messageStat(){
        const { ctx } = this;
        ctx.helper.validate(Rules.messageStatRule);
        const {company_id} = ctx.query;

        const list = await ctx.service.rdStat.messageStat.messageStat({
            company_id
        });
        ctx.body = {
            result: true,
            list
        }
    }
}

module.exports = RdStatController;