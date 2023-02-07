'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v2');
    apiRouter.get('/private/listAppBoxes',controller.v2.box.listAppBoxes);
    apiRouter.get('/private/boxDetail',controller.v2.box.getBoxDetail);
    apiRouter.patch('/private/:box_id/box',controller.v2.box.updateBox);
    apiRouter.post('/private/box',controller.v2.box.createBox);
    apiRouter.post('/public/api/call',controller.v2.box.callBox);
};
