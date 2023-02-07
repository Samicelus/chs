'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/fake');
    apiRouter.get('/medicine/check',controller.fake.hisCheckStorage);
    apiRouter.get('/medicine/sync', controller.fake.hisSyncMedicine);
    apiRouter.get('/anotherHospital/sync', controller.fake.hisSyncMedicine2);
    apiRouter.get('/medicine/test', controller.fake.test);
    apiRouter.post('/advice/his', controller.fake.insertAdvice);
    apiRouter.get('/onlineinquiry/queryStockByDrugCode', controller.fake.queryStockByDrugCode);
    apiRouter.get('/countMessage', controller.fake.countMessage);
    apiRouter.get('/updateMessage', controller.fake.updateMessage);
};
