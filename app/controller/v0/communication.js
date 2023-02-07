'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    createSubjectRule: {
        body: {
            question:{
                type: 'string',
                required: true
            },
            patient:{
                type: 'string',
                required: true
            },
            cardInfo:{
                type: 'string',
                required: false
            },
            patientRecord:{
                type: 'string',
                required: false
            },
            question_type:{
                type: 'string',
                required: false
            }
        }
    },
    searchDoctorRule: {
        query:{
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
                default: 20,
                min: 10,
                max: 200
            },
            nickname: {
                type: 'string',
                required: false
            },
            is_recommended: {
                type: 'enum',
                required: false,
                values: [ "on", "off" ]
            },
            tuishiben_id: {
                type: 'string',
                required: false
            },
            group_id: {
                type: 'string',
                required: false
            },
            out_id: {
                type: 'string',
                required: false
            }
        }
    },
    openDoctorRule: {
        body: {
            users: {
                type: 'string'
            }
        }
    },
    addDepartmentRule: {
        body: {
            group_for_patient: {
                type: 'string',
                required: false
            },
            gfp_url: {
                type: 'string',
                required: false
            },
            gfp_mod: {
                type: 'string',
                required: false
            },
            out_id: {
                type: 'string',
                required: false
            },
            desc: {
                type: 'string',
                required: false
            },
            his_id: {
                type: 'string',
                required: false
            }
        }
    }
};

class CommunicationController extends Controller {
    
    /**
     * [患者端] 创建在线问诊咨询单
     */
    async createSubject() {
        const { ctx, logger, app } = this;
        ctx.helper.validate(Rules.createSubjectRule);
        let company_id = ctx.headers['company_id'];
        let {question, patient, cardInfo, patientRecord, question_type} = ctx.request.body
        try{
            question = JSON.parse(question);
            if(question.company_id){
                company_id = question.company_id;
            }
            patient = JSON.parse(patient);
            if(cardInfo){
                cardInfo = JSON.parse(cardInfo);
            }
            if(patientRecord){
                patientRecord = JSON.parse(patientRecord);
            }
            let patientObj = {
                emtId: patient.userId,
                profile:{
                    identityCard: patient.identityCard,
                    name: patient.name,
                    phone: patient.phone,
                    birth: patient.birth,
                    address: patient.address,
                    sex: patient.sex,
                    age: patient.age
                }
            }
            cardInfo.cardNo = cardInfo.CardNo;
            const {patient_id, cardNo} = await ctx.service.module.patient
            .savePatient(patientObj, cardInfo);

            let record_id;
            if(patientRecord){
                let patientRecordObj = {
                    hospital: patientRecord.hospital,
                    date: patientRecord.date,
                    dept: patientRecord.department,
                    doctor: patientRecord.doctor,
                    diagnosis: patientRecord.diagnosis,
                    pic: patientRecord.pic,
                    status: "wait"
                }
                record_id = (await ctx.service.module.record
                .saveRecord(patientRecordObj, patient_id)).record_id;
                app.bus.emit('recordRenewed', patientRecordObj);
            }

            const {result, message, doctor_id, app_id} = await ctx.service.v0.communication.verifyDoctor({
                doctor_id: question.doctor_id,
                company_id
            });
            
            if(!result){
                ctx.body = {
                    result: false,
                    message
                }
                return;
            }

            const checkResult = await ctx.service.v0.communication.checkSubject(
                {
                    subject_id: question.subjectId,
                    company_id
                }
            );

            if(!checkResult.result){
                ctx.body = {
                    result: false,
                    message: checkResult.message
                }
                return;
            }

            const {consultObj, user_id} = await ctx.service.module.consult
            .createConsult(
                app_id, 
                doctor_id, 
                patient_id,
                {
                    title: question.title,
                    image: question.image
                }, 
                record_id,
                cardNo,
                question.subjectId
            );

            //发送message
            const {messageObj} = await ctx.service.module.message
            .saveMessage(
                {
                    content: `患者:${patient.name}向您咨询问题,请及时回复`,
                    from: 'patient'
                },
                consultObj._id
            );
            await ctx.service.module.consult.setListRenewed({user_id, patient_id});
            app.bus.emit('messageSaved', messageObj);
            ctx.body = {
                result: true,
                consult: consultObj
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    /**
     * [医生端后台] 搜索医生
     */
    async searchDoctor() {
        const { ctx, logger, app } = this;
        ctx.helper.validate(Rules.searchDoctorRule);
        const {page, pageSize, nickname, is_recommended, tuishiben_id, group_id, out_id} = ctx.query;
        let company_id = ctx.headers["company_id"];

        let {list, count} = await ctx.service.v0.communication
        .searchDoctor({page, pageSize, company_id, nickname, is_recommended, tuishiben_id, group_id, out_id});
    
        ctx.body = {
            result: true,
            dataList: list,
            count,
            page,
            pageSize
        }
    }

    /**
     * [医生端后台] 开通医生，修改医生信息，支持批量
     */
    async openDoctor() {
        const { ctx, logger, app: {mongoose: {Types: { ObjectId }}} } = this;
        ctx.helper.validate(Rules.openDoctorRule);
        let company_id = ctx.headers['company_id'];
        let {users} = ctx.request.body;
        try{
            users = JSON.parse(users);
            for(let user of users){

                let profile = {
                        profession: user.profession,
                        sections: user.sections,
                        description: user.description,
                        department_id: user.out_id,
                        onlineDesc: user.online_desc
                    }

                let consultTypes = {                          //针对问诊类型的设置
                        text: {                             //图文问诊
                            isOpen: (user.service === "on"),
                            isAvailable: (user.status === "on"),
                            price: user.price_text || 1,
                            push: {                         //推送设置
                                pushType: user.push_type,
                                pushTime: user.push_time
                            }
                        },
                        phone: {                            //电话问诊
                            isOpen: (user.service_phone === "on"),
                            isAvailable: (user.status_phone === "on"),
                            price: user.price_phone || 1
                        },
                        video: {                            //视频问诊
                            isOpen: (user.service_video === "on"),
                            isAvailable: (user.status_video === "on"),
                            price: user.price_video || 1
                        }
                    }

                let hisPower = {                             //跟his功能相关的设置
                    hisId: user.his_id,
                    canGiveAdvice: user.can_give_advice,
                    canGiveLab: user.can_give_lab,
                    canGivePicture: user.can_give_picture,
                    canGiveRecord: user.can_give_record,
                }

                let CA = {                                   //跟CA相关信息
                    state: user.CA_state,
                    idCard: user.id_card,
                    professionIdType: user.profession_id_type,
                    professionId: user.profession_id
                }

                let {result, message, doctor_app_id, doctor_id} = await ctx.service.module.doctor.addDoctor({
                    company_id,
                    user_id: user.user_id,
                    profile,
                    consultTypes,
                    hisPower,
                    CA
                });

                if(result){
                    this.app.bus.emit('doctorChange', {
                        app_id: doctor_app_id,
                        doctor_id
                    });
                }else{
                    logger.error(message)
                }
            }
            
            ctx.body = {
                result: true,
                data: "ok"
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    /**
     * [医生端后台] 添加，修改科室
     */
    async addDepartment() {
        const { ctx, logger, app: {mongoose: {Types: { ObjectId }}} } = this;
        ctx.helper.validate(Rules.addDepartmentRule);
        let company_id = ctx.headers['company_id']; 
        const {group_for_patient, gfp_url, gfp_mod, out_id, desc, his_id} = ctx.request.body;

        let department = {
            name: group_for_patient
        }

        let {departmentObj} = await ctx.service.module.doctor.addDepartment({
            department,
            app_id
        });
    }

}

module.exports = CommunicationController;
