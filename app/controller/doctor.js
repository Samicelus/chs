'use strict';

const Controller = require('egg').Controller;

const {DOCTOR_PROPERTY_MAP} = require('../../const/model/doctor');
// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    addDoctorRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            user_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            profile: {
                type: 'object',
                required: false,
                rule: {
                    description: {
                        type: 'string',
                        required: false
                    },
                    sections: {
                        type: 'string',
                        required: false
                    },
                    profession: {
                        type: 'string',
                        required: false
                    },
                    property: {
                        type: 'enum',
                        required: false,
                        values: [ "doctor", "nurse", "technician"]
                    }
                }
            }
        }
    },
    getDoctorsRule: {
        query: {
            department_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
    },
    addDepartmentRule: {
        body: {
            department: {
                type: 'object',
                rule: {
                    name: {
                        type: 'string'
                    }
                }
            },
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    updateDepartmentRule: {
        params: {
            department_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            name: {
                type: 'string',
                required: false
            },
            description: {
                type: 'string',
                required: false
            }
        }
    },
    removeDepartmentRule: {
        params: {
            department_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    listDepartmentRule: {
        query: {
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 200,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "name" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        }
    },
    listDoctorRule: {
        query: {
            app_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            },
            department_ids:{
                type: 'string',
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 200,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "name" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        }
    },
    updateDoctorRule: {
        params:{
            doctor_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            department_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            property: {
                type: 'enum',
                values: Object.keys(DOCTOR_PROPERTY_MAP),
                required: false
            },
            description: {
                type: 'string',
                required: false
            },
            profession: {
                type: 'string',
                required: false
            },
            sections: {
                type: 'string',
                required: false
            },
            canGiveAdvice: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            canGiveLab: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            canGivePicture: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            canGiveRecord: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            idCard: {
                type: 'string',
                regex: /^[0-9x]{16,18}$/,
                required: false
            },
            professionIdType: {
                type: 'string',
                required: false
            },
            professionId: {
                type: 'string',
                required: false
            },
            textOpen: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            textPrice: {
                type: 'int',
                required: false
            },
            phoneOpen: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            phonePrice: {
                type: 'int',
                required: false
            },
            videoOpen: {
                type: 'enum',
                values: ['true','false'],
                required: false
            },
            videoPrice: {
                type: 'int',
                required: false
            },
            hisId: {
                type: 'string',
                required: false
            }
        }
    },
    listCompanyUserRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            }
        }
    }
};

class DoctorController extends Controller {
    async addDoctor() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.addDoctorRule);
        let {app_id, user_id, profile} = ctx.request.body;
        let {result} = await ctx.service.module.doctor.addDoctor({
            app_id,
            user_id,
            profile
        });

        ctx.body = {
            result: true,
            addResult: result
        }
    }

    async getDoctors() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getDoctorsRule);
        const {department_id} = ctx.query;
        let app_id = ctx.headers["app-id"]
        const list = await ctx.service.module.doctor.getDoctors({
            app_id,
            department_id
        });

        ctx.body = {
            result: true,
            list
        }
    };

    async addDepartment(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.addDepartmentRule);
        const {department, app_id} = ctx.request.body;
        let {departmentObj} = await ctx.service.module.doctor.addDepartment({
            department,
            app_id
        });

        ctx.body = {
            result: true,
            department: departmentObj
        }
    }

    async updateDepartment(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateDepartmentRule);
        const {department_id} = ctx.params;
        const {
            name,
            description
        } = ctx.request.body;
        let doctor = await ctx.service.module.doctor.updateDepartment({
            department_id,
            name,
            description
        });

        ctx.body = {
            result: true,
            doctor
        }
    }

    async removeDepartment(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.removeDepartmentRule);
        let {departmentObj} = await ctx.service.module.doctor.removeDepartment({
            department_id: ctx.params.department_id
        });

        ctx.body = {
            result: true,
            department: departmentObj
        }
    }

    async listDepartment(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listDepartmentRule);
        const {app_id, page, pageSize, sortField, sortOrder} = ctx.query;
        let {list, count} = await ctx.service.module.doctor.listDepartment({
            app_id,
            page,
            pageSize,
            sortField,
            sortOrder
        });

        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async listDoctor(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listDoctorRule);
        const {app_id, search, department_ids, page, pageSize, sortField, sortOrder} = ctx.query;
        let {list, count} = await ctx.service.module.doctor.listDoctor({
            app_id,
            search,
            department_ids,
            page,
            pageSize,
            sortField,
            sortOrder
        });

        ctx.body = {
            result: true,
            list,
            count,
            page,
            pageSize
        }
    }

    async updateDoctor(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateDoctorRule);
        const {doctor_id} = ctx.params;
        const {
            department_id,
            property,
            description,
            profession,
            sections,
            canGiveAdvice,
            canGiveLab,
            canGivePicture,
            canGiveRecord,
            idCard,
            professionIdType,
            professionId,
            textOpen,
            textPrice,
            phoneOpen,
            phonePrice,
            videoOpen,
            videoPrice,
            hisId
        } = ctx.request.body;
        let doctor = await ctx.service.module.doctor.updateDoctor({
            doctor_id,
            department_id,
            property,
            description,
            profession,
            sections,
            canGiveAdvice,
            canGiveLab,
            canGivePicture,
            canGiveRecord,
            idCard,
            professionIdType,
            professionId,
            textOpen,
            textPrice,
            phoneOpen,
            phonePrice,
            videoOpen,
            videoPrice,
            hisId
        });

        ctx.body = {
            result: true,
            doctor
        }
    }

    async listCompanyUser(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listCompanyUserRule);
        const {app_id, search} = ctx.query;
        let {list} = await ctx.service.module.doctor.listCompanyUser({
            app_id,
            search
        });
        
        ctx.body = {
            result: true,
            list
        }
    }
}

module.exports = DoctorController;
