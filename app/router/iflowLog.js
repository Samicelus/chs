'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.get('/iflowLog',controller.iflowLog.getIflowLog);
    apiRouter.get('/IflowProcessTime',controller.iflowLog.getIflowProcessTime);
};
