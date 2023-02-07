'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/private');
    apiRouter.get('/backup/exportConfigs',controller.backup.exportConfigs);
    apiRouter.post('/backup/:app_id/analyseBackupFile',controller.backup.analyseBackupFile);
    apiRouter.post('/backup/importConfigs',controller.backup.importConfigs);
    apiRouter.get('/backup/exportGroupItems',controller.backup.exportGroupItems);
};
