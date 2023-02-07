'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.get('/foo/access',controller.foo.access);
    apiRouter.post('/foo/access',controller.foo.access);
    apiRouter.post('/foo/test',controller.foo.testBox);
    apiRouter.post('/foo/upgrade',controller.foo.upgradeOneApi);
};
