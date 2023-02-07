'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.post('/consult',controller.consult.createConsult);
    apiRouter.post(
        '/message/doctor/send',
        app.middleware.module({
            moduleKey: "consult",
            actionKey: "sendDoctorMessage"
        }),
        controller.consult.sendDoctorMessage
    );
    apiRouter.post(
        '/message/patient/send',
        app.middleware.module({
            moduleKey: "consult",
            actionKey: "sendPatientMessage"
        }),
        controller.consult.sendPatientMessage
    );
    apiRouter.get(
        '/consult',
        controller.consult.getConsults
    );
    apiRouter.get(
        '/myConsult',
        controller.consult.getMyConsults
    );
    apiRouter.get(
        '/consult/detail',
        controller.consult.getConsultDetail
    );
    apiRouter.patch(
        '/:consult_id/consult/close',
        app.middleware.module({
            moduleKey: "consult",
            actionKey: "closeConsult"
        }),
        controller.consult.closeConsult
    );
    apiRouter.post(
        '/consult/comment',
        controller.consult.commentConsult
    );
    apiRouter.post(
        '/consult/voice/send',
        controller.consult.sendVoice
    )
};
