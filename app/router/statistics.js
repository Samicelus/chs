'use strict';

module.exports = app => {
    const { router, controller, middleware} = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/private');
    apiRouter.get('/itemStatistics', middleware.power({
        module: 'statistics',
        power: 'view'
    }), controller.statistics.itemStatistics);
    apiRouter.get('/templateStatistics', middleware.power({
        module: 'statistics',
        power: 'view'
    }), controller.statistics.templateStatistics);
    apiRouter.get('/statistics', middleware.power({
        module: 'statistics',
        power: 'view'
    }), controller.statistics.generalStatistics);
};
