'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    callApiRule: {
        body: {
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            apiName: {
                type: 'string',
                required: false
            },
            company_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            hospitalId: {
                type: 'int',
                required: false
            },
            tagName: {
                type: 'string',
                required: false
            },
            type: {                     //同一类型的接口可能存在不同形态
                type: 'string',
                required: false
            },
            params: {
                type: 'object',
                required: false
            }
        },
    },
    getCompanyApiListRule: {
        query: {
            company_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getCompanyEventFailLogsRule: {
        query: {
            company_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            tagDescription: {
                type: 'string',
                required: false
            },
            failTimes: {
                type: 'int',
                convertType: 'int',
                required: false
            },
            fromCreated: {
                type: 'string',
                required: false
            },
            toCreated: {
                type: 'string',
                required: false
            },
            fromRecentTried: {
                type: 'string',
                required: false
            },
            toRecentTried: {
                type: 'string',
                required: false
            },
            fullfilled: {
                type: 'string',
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 200,
                min: 10,
                max: 200
            }
        }
    },
    recallFailEventRule: {
        query: {
            eventFailLog_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class ApiController extends Controller {
    async callApi() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.callApiRule);
            const {app_id, apiName, company_id, hospitalId, tagName, type, params} = ctx.request.body;
            
            const {userInfo} = ctx.request;

            //非Admin用户校验接口调用权限
            if(!userInfo.isAdmin){
                let scope = userInfo.scope;

                if(company_id){
                    let companyScope = scope.filter(item=>!!item.company_oid).map(item=>item.company_oid.toString());
                    if(!companyScope.includes(company_id)){
                        throw new Error('用户无该医院接口调用权限!')
                    }
                }
    
                if(hospitalId){
                    let hospitalScope = scope.filter(item=>!!item.hospitalId).map(item=>item.hospitalId);
                    if(!hospitalScope.includes(hospitalId)){
                        throw new Error('用户无该医院接口调用权限!')
                    }
                }
            }
            

            //检查当前用户可见company权限
            // let userScopeChecked = await ctx.service.user.checkUserScope({
            //     app_id, 
            //     company_id, 
            //     userInfo: ctx.request.userInfo
            // })
            //不在此处做医院可见权限判断
            let userScopeChecked = true;
            if(!userScopeChecked){
                ctx.body = {
                    success: false,
                    code: '401',
                    message: 'unauthorized userScope!'
                };
            }else{
                logger.info(`about to invoque: ${ctx.request.body.apiName}`)

                let result = await ctx.service.api.callConfigedApi({
                    app_id,
                    apiName,
                    company_id, 
                    hospitalId,
                    tagName,
                    type,
                    params,
                });

                let resp = {
                    data: result
                }

                if(typeof result == 'string'){
                    resp.success = false;
                    resp.code = 500;
                }else{
                    resp.success = true;
                    resp.code = 200;
                }

                ctx.body = resp;
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J001',
                message: e.message
            }
        }
    };

    async getCompanyApiList () {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.getCompanyApiListRule);
            const {company_id} = ctx.query;

            let list = await ctx.service.api.getCompanyApiList({
                company_id
            });

            ctx.body = {
                success: true,
                list
            };
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J002',
                message: e.message
            }
        }
    }

    async getCompanyEventFailLogs () {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.getCompanyEventFailLogsRule);
            const {
                company_id,
                app_id,
                tagDescription, 
                failTimes, 
                fromCreated, 
                toCreated,
                fromRecentTried,
                toRecentTried,
                fullfilled,
                page,
                pageSize
            } = ctx.query;

            let {list, count} = await ctx.service.api.getCompanyEventFailLogs({
                company_id,
                app_id,
                tagDescription, 
                failTimes, 
                fromCreated, 
                toCreated,
                fromRecentTried,
                toRecentTried,
                fullfilled,
                page,
                pageSize
            });

            ctx.body = {
                success: true,
                list,
                count
            };
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J002',
                message: e.message
            }
        }
    }

    async recallFailEvent () {
        const { ctx, logger } = this;

        try {

            const {eventFailLog_id} = ctx.request.body;

            ctx.helper.validate(Rules.recallFailEventRule);

            let result = await ctx.service.api.recallFailEvent({
                eventFailLog_id
            });

            let resp = {
                data: result
            }

            if(typeof result == 'string'){
                resp.success = false;
                resp.code = 500;
            }else{
                resp.success = true;
                resp.code = 200;
            }

            ctx.body = resp;

        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J002',
                message: e.message
            }
        }
    }
}

module.exports = ApiController;
