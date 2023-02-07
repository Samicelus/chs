'use strict';

const Controller = require('egg').Controller;
const stream = require('stream');
const moment = require('moment');
const fs = require('fs');
// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    exportConfigsRule: {
        query:{
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportGroupItemsRule: {
        query:{
            group_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class BackupController extends Controller {

    async exportConfigs() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.exportConfigsRule);

        try{
            let {app_id} = ctx.query;
            
            let result = await ctx.service.backup.backup.exportConfigs({
                app_id
            });
            let fileStream = new stream.PassThrough();
            fileStream.end(new Buffer(JSON.stringify(result,null,2)));
            ctx.attachment(`/${result.fileName}-${new moment().format('YYYY-MM-DD HH:mm:ss')}.json`);
            ctx.set('Content-Type', 'application/octet-stream');
            ctx.body = fileStream;
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }

    };

    async analyseBackupFile() {
        const { ctx, logger } = this;
        const { files } = ctx.request;
        try{
            let {app_id} = ctx.params;
            const file = files[0];
            const filepath = file.filepath;

            let bufferContent = await fs.readFileSync(filepath);
            let strContent = bufferContent.toString('utf-8');
            let content = JSON.parse(strContent)

            let result = await ctx.service.backup.backup.analyseBackupFile({
                content,
                app_id
            });
            ctx.body = {
                result
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async importConfigs() {
        const { ctx, logger } = this;

        try{
            let {app_id, addedTags, addedConfigs, replacedConfigs} = ctx.request.body;
            
            let result = await ctx.service.backup.backup.importConfigs({
                app_id, 
                addedTags, 
                addedConfigs, 
                replacedConfigs
            });
            
            ctx.body = {
                result
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async exportGroupItems(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.exportGroupItemsRule);

        try{
            let {group_id} = ctx.query;
            
            let result = await ctx.service.backup.backup.exportGroupItems({
                group_id
            });
            let fileStream = new stream.PassThrough();
            fileStream.end(new Buffer(JSON.stringify(result,null,2)));
            ctx.attachment(`/${new moment().format('YYYY-MM-DD HH:mm:ss')}.json`);
            ctx.set('Content-Type', 'application/octet-stream');
            ctx.body = fileStream;
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
}

module.exports = BackupController;
