'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.post(
        '/advice/syncMedicine',
        controller.advice.syncMedicine
    );
    apiRouter.get(
        '/advice/checkStorage',
        app.middleware.module({
            moduleKey: "advice",
            actionKey: "checkStorage"
        }),
        controller.advice.checkStorage
    );
    apiRouter.get(
        '/advice/medicines',
        controller.advice.listMedicines
    );

    apiRouter.post(
        '/advice/create',
        app.middleware.module({
            moduleKey: "advice",
            actionKey: "createAdvice"
        }),
        controller.advice.createAdvice
    );

    apiRouter.get(
        '/advice',
        controller.advice.listAdvices
    );

    apiRouter.get(
        '/advice/wait',
        controller.advice.getWaitAdvice
    );

    apiRouter.post(
        '/advice/send',
        app.middleware.module({
            moduleKey: "advice",
            actionKey: "sendAdvice"
        }),
        controller.advice.sendAdvice
    );
};
