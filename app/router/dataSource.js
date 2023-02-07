'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.post('/sourceConfig',controller.dataSource.addSourceConfig);
    apiRouter.patch('/:source_id/sourceConfig',controller.dataSource.updateSourceConfig);
    apiRouter.get('/sourceConfig',controller.dataSource.listSourceConfig);
    apiRouter.post('/customizeModel',controller.dataSource.addCustomizeModel);
    apiRouter.patch('/:model_id/customizeModel',controller.dataSource.updateCustomizeModel);
    apiRouter.get('/customizeModel',controller.dataSource.listCustomizeModel);
    apiRouter.get('/getTable',controller.dataSource.getTable);
    apiRouter.get('/getStructure',controller.dataSource.getStructure);
    //apiRouter.get('/getData',controller.dataSource.getData); //缺陷：占满连接池，废弃。
    apiRouter.post('/:config_id/getDataByConfig',controller.dataSource.getDataByConfig);
    apiRouter.get('/getApiConfiguredQuery', controller.dataSource.getApiConfiguredQuery);
    apiRouter.post('/testDataSource', controller.dataSource.test);
    apiRouter.post('/constructSelectedSchema', controller.dataSource.constructSelectedSchema);
    apiRouter.post('/autoConstructSchema', controller.dataSource.autoConstructSchema);

    apiRouter.get('/analyseData', controller.dataSource.analyseData);
    apiRouter.post('/postQueryConfig', controller.dataSource.postQueryConfig);
    apiRouter.get('/getQueryConfig', controller.dataSource.getQueryConfigData);
    apiRouter.get('/getQueryConfigById', controller.dataSource.getQueryConfigById);
    apiRouter.post('/deleteQueryConfig', controller.dataSource.deleteQueryConfigData);
    apiRouter.post('/updateQueryConfig', controller.dataSource.updateQueryConfig);
    apiRouter.get('/getModelSchemaDetail', controller.dataSource.getModelSchemaDetail);
    apiRouter.get('/docMap', controller.dataSource.getDocMap);
    apiRouter.post('/queryLog', controller.dataSource.queryLog);
};
