'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.get('/pushLog',controller.pushLog.getPushLog);
    apiRouter.post('/pushLog/resendFail',controller.pushLog.resendFail);
};
