'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v2');
    apiRouter.get('/private/dataBlockDetail',controller.v2.dataBlock.getDataBlockDetail);
    apiRouter.patch('/private/:block_id/dataBlock',controller.v2.dataBlock.updateDataBlock);
    apiRouter.post('/private/dataBlock',controller.v2.dataBlock.createDataBlockToBox);
    apiRouter.post('/private/deleteDataBlock',controller.v2.dataBlock.deleteDataBlock);
};
