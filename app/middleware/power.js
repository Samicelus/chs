'use strict';

module.exports = options => {
    return async function (ctx, next) {
        const modulename = options.module;
        const power = options.power;
        let userInfo = ctx.request.userInfo;
        ctx.logger.info(`user ${userInfo.username} access:${JSON.stringify(userInfo.access)} isAdmin:${userInfo.isAdmin}`);
        
        if(userInfo.isAdmin){
            await next();
        }else{
            let powerMap = {};
            userInfo.access.forEach(item=>{
                powerMap[item.module] = {}
                item.power.forEach(power=>{
                    powerMap[item.module][power] = true;
                })
            });
            if(powerMap[modulename] && powerMap[modulename][power]){
                await next();
            }else{
                ctx.status = 401;
                ctx.body = {
                    code: 401,
                    error: "Unauthorized",
                    message: `no access for module: ${modulename}`
                };
            }
        }
    };
};
