'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
};

class SystemController extends Controller {
    async healthCheck(){
        this.ctx.body = {
            status:"UP"
        }
    }
}

module.exports = SystemController;
