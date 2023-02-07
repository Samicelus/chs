'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    getTokenRule: {
        body: {
            login: {
                type: 'string',
                required: true
            },
            password: {
                type: 'string',
                required: true,
                regex: /^[a-zA-Z0-9!@#$%^&*()]{3,30}$/
            }
        }
    },
    loginRule: {
        body: {
            login: {
                type: 'string',
                required: true
            },
            password: {
                type: 'string',
                required: true,
                regex: /^[a-zA-Z0-9!@#$%^&*()]{3,30}$/
            }
        },
    },
    qywechatRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            code: {
                type: 'string',
                required: true
            }
        },
    },
    getWexinQyUserInfoRule: {
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
            code: {
                type: 'string',
                required: false
            }
        }
    }
};

class userController extends Controller {
    async getToken() {
        const { ctx } = this;
        ctx.helper.validate(Rules.getTokenRule);
        const {login, password} = ctx.request.body;
        const result = await ctx.service.user.getToken(login, password);

        if(result.result){
            ctx.body = {
                ...result
            }
        } else {
            ctx.body = {
                result: false,
                message: result.message
            }
        }
    };

    async login() {
        const { ctx } = this;
        ctx.helper.validate(Rules.loginRule);
        const {login, password} = ctx.request.body;
        const result = await ctx.service.user.login(login, password);

        if(result.result){
            ctx.body = {
                ...result
            }
        } else {
            ctx.body = {
                result: false,
                message: result.message
            }
        }
    };

    /**
     * 企业微信用户登录，并获取jssdk所需签名
     * 
     * 
     */
    async qywechat() {
        const {ctx } = this;
        ctx.helper.validate(Rules.qywechatRule);
        const {app_id, code} = ctx.request.body;
        const info = await ctx.service.api.callConfigedApi({
            app_id,
            apiName: '获取医生企业微信身份',
            params: {
                appConfig_id: app_id,
                code
            }
        });

        const result = await this.service.user.qywechat(info);
        const jssdk = await this.service.qywechat.jssdkSign({app_id});
        const corpId = await this.service.qywechat.getCorpId({app_id});
        if(result.result){
            ctx.body = {
                ...result,
                ...jssdk,
                corpId
            }
        } else {
            ctx.body = {
                result: false,
                message: result.message
            }
        }
    }

    async listRoles(){
        const { ctx } = this;
        const result = await ctx.service.user.listRoles();
        ctx.body = {
            ...result
        }
    }

    async addRole(){
        const { ctx } = this;
        const {name, access} = ctx.request.body;
        const result = await ctx.service.user.addRole({
            name,
            access
        });
        ctx.body = {
            ...result
        }
    }

    async addUser(){
        const { ctx } = this;
        const {username, role_id} = ctx.request.body;
        const result = await ctx.service.user.addUser({
            username,
            role_id
        });
        ctx.body = {
            ...result
        }
    }

    async setUserRole(){
        const { ctx } = this;
        const { user_id } = ctx.params;
        const {role_id} = ctx.request.body;
        const { user } = await ctx.service.user.setUserRole({
            user_id,
            role_id
        });
        ctx.body = {
            result: true,
            user
        }
    }

    async listUsers(){
        const { ctx } = this;
        const {
            search,
            page=1, 
            pageSize=10, 
            sortField, 
            sortOrder
        } = ctx.query;
        const {list, count} = await ctx.service.user
        .listUsers({
            search,
            page,
            pageSize,
            sortField,
            sortOrder
        });
        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async modifyUserScope(){
        const { ctx } = this;
        const {user_id} = ctx.params;
        const {scope} = ctx.request.body;
        const result = await ctx.service.user.modifyUserScope({
            user_id,
            scope
        });
        ctx.body = {
            ...result
        }
    }

    async changePassword(){
        const { ctx, logger } = this;
        const {user_id} = ctx.params;
        const {password, newPassword} = ctx.request.body;
        const helper = ctx.helper;
        try{

            let {hasLower, hasUpper, hasNum, hasSpec, atLeast8, has3Diff} = helper.checkPasswordSecurity(newPassword);

            if(!atLeast8){
                throw new Error("密码长度必须为8~255个字符!");
            }

            if(!has3Diff){
                throw new Error("密码必须包含数字，大，小写英文字母，特殊符号中的至少3种!");
            }

            const result = await ctx.service.user.changePassword({
                user_id,
                password,
                newPassword
            });
            ctx.body = {
                ...result
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J001',
                message: e.message
            }
        }
    }

    async resetUserPassword(){
        const { ctx } = this;
        let userInfo = ctx.request.userInfo;
        const {user_id} = ctx.params;
        try{

            if(!userInfo.isAdmin){
                throw new Error("无管理员权限!");
            }

            const result = await ctx.service.user.resetPassword({
                user_id
            });
            ctx.body = {
                ...result
            }
        }catch(e){
            logger.error(e.stack);
            ctx.body = {
                success: false,
                code: 'J001',
                message: e.message
            }
        }
    }

    async getModulePowerMap(){
        const { ctx } = this;
        const MODULE_MAP = await ctx.service.user
        .getModuleMap();
        const POWER_MAP = await ctx.service.user
        .getPowerMap();
        ctx.body = {
            result: true,
            module: MODULE_MAP,
            power: POWER_MAP
        }
    }

    async getWexinQyUserInfo(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getWexinQyUserInfoRule);
        let {company_id, app_id, code} = ctx.query;
        logger.info(company_id, app_id, code)
        const result = await ctx.service.user.getUserInfo({company_id, app_id, code});
        ctx.body = {
            result: true,
            data: result
        }
    }
}

module.exports = userController;
