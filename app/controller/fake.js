'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
};

class FakeController extends Controller {
    async hisCheckStorage() {
        const { ctx } = this;
        let result = Math.random() > 0.5 ? 1: 0;
        this.logger.info(`result: ${result}`)
        ctx.body = {
            data: result
        }
    };

    async hisSyncMedicine() {
        const {ctx} = this;

        const list = await ctx.service.fake.his.syncMedicine();

        ctx.body = {
            data: list
        }
    }

    async hisSyncMedicine2() {
        const {ctx} = this;
        ctx.helper.validate(Rules.hisSyncMedicineRule);

        const list = await ctx.service.fake.his.syncMedicine2();

        ctx.body = {
            data: list
        }
    }

    async test() {
        const {ctx} = this;
        const list = await ctx.service.fake.his.test();
        ctx.body = {
            data: list
        }
    }

    async insertAdvice(){
        const {ctx} = this;
        const list = await ctx.service.fake.his.getGroups();
        ctx.body = {
            result: true,
            input: ctx.request.body,
            list
        }
    }

    async queryStockByDrugCode(){
        const {ctx} = this;
        const result = await ctx.service.fake.his.queryStockByDrugCode({arcCode:ctx.query.arcCode});
        ctx.body = {
            resultCode: 'success',
            resultMsg: "successful",
            data: result,
            api: null,
            method: null,
            version: null,
            result: null,
            page: true
        }
    }
    
    async countMessage() {
        const {ctx} = this;
        const {count, example} = await ctx.service.fake.script.countMessage();
        ctx.body = {
            count, example
        }
    }

    async updateMessage() {
        const {ctx} = this;
        const list = await ctx.service.fake.script.updateMessage();
        ctx.body = {
            list
        }
    }
}

module.exports = FakeController;
