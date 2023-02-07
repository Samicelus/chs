'use strict';

const Controller = require('egg').Controller;
const path = require('path');

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
};

class CosController extends Controller {
    async saveFile(){
        const { ctx, logger } = this;
        const { files } = ctx.request;
        try{
            const file = files[0];
            console.log(file);
            const name = path.basename(file.filename);
            const filepath = file.filepath;

            let { url } = await ctx.service.cos.cos.putFile({name, filepath});
            ctx.body = {
                result: true,
                url
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

module.exports = CosController;
