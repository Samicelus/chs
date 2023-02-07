'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.patch(
        '/:consult_id/record',
        app.middleware.module({
            moduleKey: "record",
            actionKey: "fillRecord"
        }),
        controller.record.fillRecord
    );
    apiRouter.get(
        '/record',
        controller.record.getRecords
    );
    apiRouter.get(
        '/record/detail',
        controller.record.getRecordDetail
    );
    apiRouter.patch(
        '/:consult_id/record/auth',
        app.middleware.module({
            moduleKey: "record",
            actionKey: "authRecord"
        }),
        controller.record.authRecord
    );
};
