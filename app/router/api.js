'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.post('/api/call',controller.api.callApi);
    apiRouter.get('/api/companyApis',controller.api.getCompanyApiList);
    apiRouter.get('/api/getCompanyEventFailLogs',controller.api.getCompanyEventFailLogs);
    apiRouter.post('/api/recallFailEvent',controller.api.recallFailEvent);
};
