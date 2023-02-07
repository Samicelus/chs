'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/private');
    apiRouter.get('/tag/search', controller.tag.searchTag);
    apiRouter.post('/tag', controller.tag.addTag);
    apiRouter.get('/apiGroup', controller.group.listApiGroup);
    apiRouter.post('/apiGroup', controller.group.addApiGroup);
    apiRouter.patch('/apiGroup/:group_id/modify', controller.group.modifyApiGroupName);
    apiRouter.patch('/apiGroup/:group_id/uploadDocs', controller.group.modifyApiGroupDocs);
    apiRouter.post('/apiGroup/item', controller.group.addItemToGroup);
    apiRouter.get('/apiGroup/item/docs',controller.group.exportStandardDoc);
    apiRouter.patch('/apiGroup/:item_id/item', controller.group.updateItem);
    apiRouter.get('/apiGroup/items', controller.group.getApiGroupItems);
    apiRouter.get('/apiGroup/item/detail', controller.group.getItemDetail);
    apiRouter.post('/apiGroup/apiTemplate', controller.group.addTemplate);
    apiRouter.get('/apiGroup/apiTemplate/item/docs',controller.group.exportTemplateDoc);
    apiRouter.post('/apiGroup/apiTemplate/items', controller.group.spawnTemplateItems);
    apiRouter.get('/apiGroup/apiTemplate/items', controller.group.getApiTemplateItems);
    apiRouter.get('/apiGroup/apiTemplate/item/detail', controller.group.getTemplateItemDetail);
    apiRouter.post('/apiGroup/apiTemplate/item', controller.group.createApiTemplateItem);
    apiRouter.post('/apiGroup/apiTemplate/callbackItem', controller.group.createApiTemplateCallbackItem);
    apiRouter.patch('/apiGroup/apiTemplate/:apiTemplateItem_id/item', controller.group.updateApiTemplateItem);
    apiRouter.get('/apiGroup/apiTemplate/searchApi', controller.group.searchApi);
    apiRouter.patch('/apiGroup/apiTemplate/:apiTemplateItem_id/replaceItem', controller.group.replaceApi);
    apiRouter.delete('/apiGroup/apiTemplate/:apiTemplateItem_id/item', controller.group.deleteApiTemplateItem);
    apiRouter.delete('/apiGroup/apiTemplate/:apiTemplateCallbackItem_id/callbackItem', controller.group.deleteApiTemplateCallbackItem);
    apiRouter.get('/apiGroup/apiTemplate/getSerialVersions', controller.group.getSerialVersions);
    apiRouter.patch('/apiGroup/apiTemplate/:apiTemplate_id/changeVersion', controller.group.changeVersion);
    apiRouter.get('/api/getTestParams', controller.group.getTestParams);
    apiRouter.get('/api/getTestReturn', controller.group.getTestReturn);
};
