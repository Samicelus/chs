/**
 * get,post and restful get as the same interface;
 */
'use strict';
module.exports = () => {
    return async function params(ctx, next) {
        if(ctx.request.rawBody && ctx.headers["content-type"] ==='application/json' && typeof ctx.request.rawBody === 'string'){
            ctx.request.body = {...JSON.parse(ctx.request.rawBody)};
        }
        ctx.params = {
            ...ctx.param,
            ...ctx.query,
            ...ctx.request.body
        }
        await next();
    };
};