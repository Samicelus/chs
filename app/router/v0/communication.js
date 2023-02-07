'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v0');
    apiRouter.post('/communication/question/create',controller.v0.communication.createSubject);
    apiRouter.get('/communication/doctor/search',controller.v0.communication.searchDoctor);
    apiRouter.post('/communication/service/open',controller.v0.communication.openDoctor);
};
