'use strict';

module.exports = app => {
    const { router, controller, middleware} = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/private/user');
    const publicRouter = router.namespace('/v1/public/user');
    publicRouter.post('/getToken', controller.user.getToken);
    apiRouter.post('/login', controller.user.login);
    apiRouter.post('/qywechat/login', controller.user.qywechat)
    apiRouter.patch('/:user_id/password',controller.user.changePassword)
    apiRouter.patch('/:user_id/reset/password',controller.user.resetUserPassword)
    apiRouter.get('/roles', middleware.power({
        module: 'userManage',
        power: 'view'
    }),controller.user.listRoles);
    apiRouter.post('/role',middleware.power({
        module: 'userManage',
        power: 'create'
    }),controller.user.addRole);
    apiRouter.patch('/:user_id/role',middleware.power({
        module: 'userManage',
        power: 'modify'
    }),controller.user.setUserRole);
    apiRouter.post('/',middleware.power({
        module: 'userManage',
        power: 'create'
    }),controller.user.addUser);
    apiRouter.get('/',middleware.power({
        module: 'userManage',
        power: 'view'
    }),controller.user.listUsers);
    apiRouter.patch('/:user_id/scope',middleware.power({
        module: 'userManage',
        power: 'modify'
    }),controller.user.modifyUserScope);
    apiRouter.get('/modulePowerMap', controller.user.getModulePowerMap);
    apiRouter.get('/weixinQy/userInfo', controller.user.getWexinQyUserInfo);
};
