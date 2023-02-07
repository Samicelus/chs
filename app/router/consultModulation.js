'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/private/consultModulation');
    apiRouter.get('/systemInfo',controller.consultModulation.getSystemInfo);
    apiRouter.post('/appConfig',controller.consultModulation.creatAppConfig);
    apiRouter.post('/appConfig/setAlertBot',controller.consultModulation.setAlertBot);
    apiRouter.post('/appConfig/api/import',controller.consultModulation.importFromTemplate);
    apiRouter.post('/appConfig/setAppSecret',controller.consultModulation.setAppSecret);
    apiRouter.delete('/:app_id/appConfig',controller.consultModulation.deleteAppConfig);
    apiRouter.get('/appConfig',controller.consultModulation.listAppConfig);
    apiRouter.get('/moduleConfig',controller.consultModulation.listModuleConfig);
    apiRouter.post('/moduleConfig/update',controller.consultModulation.updateModule);
    apiRouter.get('/statusConfig',controller.consultModulation.listStatusConfig);
    apiRouter.post('/statusConfig/update',controller.consultModulation.updateStatus);
    apiRouter.get('/apiConfig',controller.consultModulation.listApiConfig);
    apiRouter.get('/apiConfig/detail',controller.consultModulation.getApiDetail);
    apiRouter.get('/apiConfig/xlsx',controller.consultModulation.exportApiXLSX);
    apiRouter.get('/apiConfig/doc',controller.consultModulation.exportApiDoc);
    apiRouter.get('/apiConfig/md',controller.consultModulation.exportApiMD);
    apiRouter.get('/apiConfig/docs',controller.consultModulation.exportApisDoc);
    apiRouter.get('/apiConfig/mds',controller.consultModulation.exportApisMD);
    apiRouter.get('/apiLog',controller.consultModulation.listApiLog);
    apiRouter.post('/apiLog/clear',controller.consultModulation.clearApiLog);
    apiRouter.get('/callbackLog',controller.consultModulation.listCallbackLog);
    apiRouter.get('/apiStatistics',controller.consultModulation.getApiStatistics);
    apiRouter.post('/apiConfig',controller.consultModulation.createApi);
    apiRouter.post('/apiConfig/copy',controller.consultModulation.copyApi);
    apiRouter.post('/callbackConfig',controller.consultModulation.createCallback);
    apiRouter.delete('/:api_id/apiConfig',controller.consultModulation.deleteApi);
    apiRouter.patch('/:api_id/adjustApiGroup',controller.consultModulation.adjustApiGroup);
    apiRouter.get('/callbackConfig',controller.consultModulation.getCallbackDetail);
    apiRouter.patch('/:callback_id/callbackConfig',controller.consultModulation.updateCallback);
    apiRouter.delete('/:callback_id/callbackConfig',controller.consultModulation.deleteCallback);
    apiRouter.post('/apiConfig/update',controller.consultModulation.updateApi);
    apiRouter.get('/customizeConfig',controller.consultModulation.getCustomizeConfig);
    apiRouter.post('/customizeConfig/update',controller.consultModulation.updateCustomizeConfig);
    apiRouter.get('/company', controller.consultModulation.getCompany);
    apiRouter.get('/docMap', controller.consultModulation.getDocMap);
    apiRouter.get('/apiTemplate/search', controller.consultModulation.searchApiTemplate);
    apiRouter.get('/getSoapWSDL', controller.consultModulation.getSoapWSDL);
    apiRouter.get('/alreadyHost', controller.consultModulation.fetchAlreadyHost);
};
