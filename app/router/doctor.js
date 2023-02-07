'use strict';

module.exports = app => {
    const { router, controller } = app;

    // version
    //使用egg-router-plus优化后的写法
    const apiRouter = router.namespace('/v1/public');
    apiRouter.get('/doctor', controller.doctor.getDoctors);
    apiRouter.get('/listDoctor', controller.doctor.listDoctor);
    apiRouter.get('/listDepartment', controller.doctor.listDepartment);
    apiRouter.post('/department', controller.doctor.addDepartment);
    apiRouter.delete('/:department_id/department', controller.doctor.addDepartment);
    apiRouter.patch('/:doctor_id/doctor', controller.doctor.updateDoctor);
    apiRouter.get('/companyUser', controller.doctor.listCompanyUser);
    apiRouter.post('/doctor', controller.doctor.addDoctor);
    apiRouter.patch('/:department_id/department', controller.doctor.updateDepartment);
};
