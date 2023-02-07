'use strict';

module.exports = options => {
    return async function (ctx, next) {
        let app_id = ctx.headers["app-id"];
        let consult_id = ctx.headers["consult-id"];
        
        //补充获取app_id和consult_id的方式
        switch(ctx.method){
            case "GET":
                if(!app_id){
                    app_id = ctx.query.app_id;
                }
                if(!consult_id){
                    consult_id = ctx.query.consult_id;
                }
                break;
            case "POST":
                if(!app_id){
                    app_id = ctx.request.body.app_id;
                }
                if(!consult_id){
                    consult_id = ctx.request.body.consult_id;
                }
                break;
            case "PATCH":
                if(!app_id){
                    app_id = ctx.params.app_id;
                }
                if(!consult_id){
                    consult_id = ctx.params.consult_id;
                }
                break;
            case "DELETE":
                if(!app_id){
                    app_id = ctx.params.app_id;
                }
                if(!consult_id){
                    consult_id = ctx.params.consult_id;
                }
                break;
            default:
                break;
        }
        ctx.logger.info(`start module check logic... app_id:consult_id ${app_id}:${consult_id}`);
        let checkResult = await ctx.helper.checkDependencies(
            app_id,
            options.moduleKey, 
            options.actionKey, 
            consult_id
        );
        if(checkResult.checked){
            ctx.request.body.app_id = app_id;
            await next();
        }else{
            ctx.body = {
                result: false,
                failStrArr: checkResult.failStrArr
            }
        }
        
    };
};
