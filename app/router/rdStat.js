'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.get('/dailyData',controller.rdStat.dailyData);
    apiRouter.get('/dailyActivities',controller.rdStat.dailyActivities);
    apiRouter.get('/averageActivities',controller.rdStat.averageActivities);
    apiRouter.get('/rdStat',controller.rdStat.rdStat);
    apiRouter.get('/activitiesRank',controller.rdStat.activitiesRank);
    apiRouter.get('/activitiesRankRate',controller.rdStat.activitiesRankRate);
    apiRouter.get('/iflowStat',controller.rdStat.iflowStat);
    apiRouter.get('/companyIflows',controller.rdStat.companyIflows);
    apiRouter.get('/iflowCreateStat',controller.rdStat.iflowCreateStat);
    apiRouter.get('/iflowCreateRank',controller.rdStat.iflowCreateRank);
    apiRouter.get('/companyDailyData',controller.rdStat.companyDailyData);
    apiRouter.get('/appAccess',controller.rdStat.appAccess);
    apiRouter.get('/userRank',controller.rdStat.userRank);
    apiRouter.get('/groupRank',controller.rdStat.groupRank);
    apiRouter.get('/showUserInfo',controller.rdStat.showUserInfo);
    apiRouter.post('/syncStatManual', controller.rdStat.syncStatManual);
    apiRouter.post('/syncStructManual', controller.rdStat.syncStructManual);

    apiRouter.get('/messageStat', controller.rdStat.messageStat);
};
