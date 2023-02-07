'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v2');
    apiRouter.get('/private/requestBlockDetail',controller.v2.requestBlock.getRequestBlockDetail);
    apiRouter.patch('/private/:block_id/requestBlock',controller.v2.requestBlock.updateRequestBlock);
    apiRouter.post('/private/requestBlock',controller.v2.requestBlock.createRequestBlockToBox);
    apiRouter.post('/private/deleteRequestBlock',controller.v2.requestBlock.deleteRequestBlock);
};
