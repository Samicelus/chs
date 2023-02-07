'use strict';

const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    createConsultRule: {
        body: {
            patient: {                              //就诊患者
                type: 'object',
                rule: {
                    _id: {
                        type: 'string',
                        required: false,
                        regex: /^[a-f0-9]{24,24}$/
                    },
                    profile: {                      //患者资料
                        type: 'object',
                        rule: {
                            identityCard: {            //患者身份证号
                                type: 'string',
                                required: false,
                                regex: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
                            },
                            name: {                     //患者姓名
                                type: 'string',
                                required: false,
                                max: 50
                            },
                            phone: {                    //患者手机号
                                type: 'string',
                                required: false,
                                max: 50
                            }
                        }
                    },
                    cards:{                         //患者就诊卡信息
                        type: 'object',
                        required: false
                    },
                }
            },
            cardInfo: {                             //就诊患者的卡信息
                type: 'object'
            },
            record: {                               //就诊记录
                type: 'object',
                rule: {
                    _id: {
                        type: 'string',
                        required: false,
                        regex: /^[a-f0-9]{24,24}$/
                    },
                    hospital: {
                        type: 'string',
                        required: false
                    },
                    date: {
                        type: 'string',
                        required: false
                    },
                    department: {
                        type: 'string',
                        required: false
                    },
                    doctor: {
                        type: 'string',
                        required: false
                    },
                    diagnosis: {
                        type: 'string',
                        required: false
                    },
                    pic: {
                        type: 'string',
                        required: false
                    }
                },
                required: false
            },
            doctor_id: {                            //问询医生id
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            complaint: {                            //患者主诉
                type: 'object',
                rule:{
                    title: {
                        type: 'string',
                        required: true
                    },
                    image: {
                        type: 'string',
                        required: false
                    }
                }
            }
        },
    },
    sendPatientMessageRule: {
        body: {
            content: {
                type: 'string',
                required: false
            },
            image: {
                type: 'string',
                required: false
            },
            voice: {
                type: 'string',
                required: false
            },
            voiceTime: {
                type: 'number',
                required: false
            }
        }
    },
    sendDoctorMessageRule: {
        body: {
            content: {
                type: 'string',
                required: false
            },
            image: {
                type: 'string',
                required: false
            },
            voice: {
                type: 'string',
                required: false
            },
            voiceTime: {
                type: 'number',
                required: false
            }
        }
    },
    getConsultsRule: {
        query: {
            user_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            type: {
                type: 'string',
                required: false
            },
            lastFetch: {
                type: 'string',
                required: false
            }
        }
    },
    getMyConsultsRule: {
        query: {
            patient_id:{
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            },
            lastFetch:{
                type: 'string',
                required: false
            }
        }
    },
    getConsultDetailRule:{
        query: {
            consult_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            readType:{
                type:'enum',
                required: false,
                values: [ "doctor", "patient" ]
            },
            lastFetch:{
                type: 'string',
                required: false
            }
        }
    },
    closeConsultRule:{
        params: {
            consult_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    commentConsultRule:{
        body: {
            consult_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            comments: {
                type: 'string',
                required: true
            },
            score: {
                type: 'int',
                required: true
            },
            anonymous: {
                type: 'boolean',
                required: false
            }
        }
    },
    sendVoiceRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            media_id: {
                type: 'string',
                required: true
            },
            consult_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class ConsultController extends Controller {
    async createConsult() {
        const { ctx, app, logger } = this;
        ctx.helper.validate(Rules.createConsultRule);
        const {patient_id, cardNo} = await ctx.service.module.patient
        .savePatient(ctx.request.body.patient, ctx.request.body.cardInfo);
        let record_id;
        if(ctx.request.body.record){
            record_id = (await ctx.service.module.record
            .saveRecord(ctx.request.body.record, patient_id)).record_id;
            app.bus.emit('recordRenewed', ctx.request.body.record);
        }
        const {consultObj, user_id} = await ctx.service.module.consult
        .createConsult(
            ctx.request.body.app_id || ctx.headers['app-id'], 
            ctx.request.body.doctor_id, 
            patient_id,
            ctx.request.body.complaint, 
            record_id,
            cardNo
        );
        //发送message
        const {messageObj} = await ctx.service.module.message
        .saveMessage(
            {
                content: `患者:${ctx.request.body.patient.profile.name}向您咨询问题,请及时回复`,
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
    };

    async sendPatientMessage() {
        const { ctx, app, logger } = this;
        ctx.helper.validate(Rules.sendPatientMessageRule);
        let {content, image, voice, voiceTime, consult_id} = ctx.request.body;
        const {messageObj, user_id, patient_id} = await ctx.service.module.message
        .saveMessage(
            {
                content,
                image,
                voice,
                voiceTime,
                from: 'patient'
            },
            consult_id
        );
        await ctx.service.module.consult.setRenewed(consult_id);
        await ctx.service.module.consult.setListRenewed({user_id, patient_id});
        app.bus.emit('messageSaved', messageObj);
        ctx.body = {
            result: true,
            message: messageObj
        }
    };

    async sendDoctorMessage() {
        const { ctx, app, logger } = this;
        ctx.helper.validate(Rules.sendDoctorMessageRule);
        let {content, image, voice, voiceTime, consult_id} = ctx.request.body;
        const {messageObj, user_id, patient_id} = await ctx.service.module.message
        .saveMessage(
            {
                content,
                image,
                voice,
                voiceTime,
                from: 'doctor'
            },
            consult_id
        );
        await ctx.service.module.consult.setRenewed(consult_id);
        await ctx.service.module.consult.setListRenewed({user_id, patient_id});
        app.bus.emit('messageSaved', messageObj);
        ctx.body = {
            result: true,
            message: messageObj
        }
    };

    async getConsults(){
        const { ctx, logger, app:{redis}} = this;
        ctx.helper.validate(Rules.getConsultsRule);
        let {user_id, type, lastFetch} = ctx.query;

        let key = `consultListDoctor:${user_id}`
        let renewed = await redis.get(key);

        if(lastFetch){
            if(renewed && renewed <= lastFetch){
                ctx.body = {
                    result: true,
                    notChanged: true
                }
                return;
            }
        }

        let app_id = ctx.headers["app-id"]
        let {result, list, message} = await ctx.service.module.consult.listConsults({
            user_id,
            app_id,
            type
        });
        ctx.body = {
            result,
            list,
            message,
            type,
            renewed
        } 
    }

    async getMyConsults(){
        const { ctx, logger,  app:{redis}} = this;
        ctx.helper.validate(Rules.getMyConsultsRule);
        let {patient_id, lastFetch} = ctx.query;

        let key = `consultListPatient:${patient_id}`
        let renewed = await redis.get(key);

        if(lastFetch){
            if(renewed && renewed <= lastFetch){
                ctx.body = {
                    result: true,
                    notChanged: true
                }
                return;
            }
        }

        let {result, list, message} = await ctx.service.module.consult.listMyConsults({
            patient_id
        });
        ctx.body = {
            result,
            list,
            message,
            renewed
        }
    }

    async getConsultDetail() {
        const { ctx, logger, app:{redis}} = this;
        ctx.helper.validate(Rules.getConsultDetailRule);
        let {consult_id, readType, lastFetch} = ctx.query;

        let key = `consultDetail:${consult_id}`
        let renewed = await redis.get(key);

        if(lastFetch){
            if(renewed && renewed <= lastFetch){
                ctx.body = {
                    result: true,
                    notChanged: true
                }
                return;
            }
        }

        let messages = await ctx.service.module.message.getMessage(consult_id);
        let consult = await ctx.service.module.consult.getConsultDetail(consult_id);
        await ctx.service.module.message.readMessages({
            consult_id,
            readType
        });
        let listRenewed = {};
        if(readType == 'doctor'){
            listRenewed.patient_id = consult.patient_oid._id.toString();
        }
        if(readType == 'patient'){
            if(consult.doctor_oid.user_oid){
                listRenewed.user_id = consult.doctor_oid.user_oid._id.toString();
            }
            if(consult.doctor_oid.consultUser_oid){
                listRenewed.user_id = consult.doctor_oid.consultUser_oid._id.toString();
            }
        }
        await ctx.service.module.consult.setListRenewed(listRenewed);
        ctx.body = {
            result: true,
            consult,
            messages,
            renewed
        }
    }

    async closeConsult() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.closeConsultRule);
        const {consult_id} = ctx.params;
        const {result, user_id, patient_id} = await ctx.service.module.consult.closeConsult(consult_id);
        if(result){
            await ctx.service.module.consult.setRenewed(consult_id);
            await ctx.service.module.consult.setListRenewed({user_id, patient_id});
        }
        await ctx.service.module.consult.afterCloseConsult();
        ctx.body = {
            result
        }
    };

    async commentConsult() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.commentConsultRule);
        const {consult_id, comments, score, anonymous} = ctx.request.body;
        const {comment} = await ctx.service.module.consult.commentConsult({
            consult_id,
            comments,
            score,
            anonymous
        });
        await ctx.service.module.consult.setRenewed(consult_id);
        ctx.body = {
            result: true,
            comment
        }
    }

    async sendVoice(){
        const { ctx, app, logger } = this;
        ctx.helper.validate(Rules.sendVoiceRule);
        const {app_id, media_id, consult_id} = ctx.request.body;
        let {messageObj, user_id, patient_id} = await ctx.service.module.message.saveVoice({app_id, media_id, consult_id});
        await ctx.service.module.consult.setRenewed(consult_id);
        await ctx.service.module.consult.setListRenewed({user_id, patient_id});
        app.bus.emit('messageSaved', messageObj);
        ctx.body = {
            result: true,
            message: messageObj
        }
    }
}

module.exports = ConsultController;
