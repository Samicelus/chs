'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.post('/:callbackTag/:app_id/callback',controller.callback.acceptCallback);
    apiRouter.get('/:callbackTag/:app_id/callback',controller.callback.acceptCallback);
};
