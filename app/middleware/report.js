'use strict';

module.exports = options => {
    return async function (ctx, next) {
        const startTime = Date.now();
        await next();
        // 上报请求时间
        const info = `${ctx.method} ${ctx.href} Body:${JSON.stringify(ctx.request.body)} Header:${JSON.stringify(ctx.headers)} TTFB:${Date.now() - startTime} ms`;
        if (options.logLevel && ['debug', 'info', 'warn', 'error'].includes(options.logLevel)) {
            ctx.logger[options.logLevel](info);
        } else {
            ctx.logger.info(info);
        }
    };
};
