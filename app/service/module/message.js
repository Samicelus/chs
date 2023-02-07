'use strict';
// app/service/user.js
const Service = require('egg').Service;

class MessageService extends Service {
    /**
     * 保存咨询单聊天消息
     * @param {Object} message 发给患者的消息
     * @param {String} consult_id 咨询单id
     */
    async saveMessage(message, consult_id) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let messageObj = await model.ConsultMessage({
            consult_oid: ObjectId(consult_id),
            ...message
        }).save();
        let consultObj = await model.Consult
        .findById(consult_id)
        .populate('doctor_oid')
        .select('doctor_oid patient_oid')
        .lean();
        return {
            messageObj,
            user_id: consultObj.doctor_oid.user_oid?consultObj.doctor_oid.user_oid.toString():consultObj.doctor_oid.consultUser_oid.toString(),
            patient_id: consultObj.patient_oid.toString()
        };
    }

    /**
     * 获取咨询单关联的聊天消息，排除已撤回和已删除的，以发送事件倒序排序
     * @param {String} consult_id 咨询单id 
     */
    async getMessage(consult_id) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let list = await model.ConsultMessage.find({
            consult_oid: ObjectId(consult_id),
            isRetrieved: false,
            isDeleted: false
        }).sort({created: 1}).lean();
        return list;
    }

    async readMessages({consult_id, readType}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        await model.ConsultMessage.update({
            consult_oid: ObjectId(consult_id),
            from: {"$in":['system', readType]}
        },{
            "$set": {
                read: true
            }
        },{
            multi: true
        }
        );
        return true;
    }

    async afterSaveDoctorMessage(){
        //TODO 发送事件，触发如向患者发消息,判断是否是第一条医生回复的消息并且未挂号
        const {logger} = this;
        logger.info(`向患者发送消息`)
        logger.info(`判断是否是第一条医生回复的消息并且未挂号,是则挂号`);
    }

    async afterSavePatientMessage({message}){
        //TODO 发送事件，触发如向医生发消息
        const {ctx, logger} = this;
        logger.info(`向医生发送消息`)

        const msgObj = await ctx.model.ConsultMessage.findById(message._id)
        .populate({
            path: 'consult_oid'
        })

        await ctx.service.api.callConfigedApi({
            app_id: msgObj.consult_oid.app_oid,
            apiName: '向医生发送消息',
            params: {
                appConfig_id: msgObj.consult_oid.app_oid,
                consultMessage_id: message._id,
                consult_id: msgObj.consult_oid._id.toString()
            }
        })
    }

    async afterSaveSystemMessage(){
        //TODO 发送事件，触发系统消息分发
        const {logger} = this;
        logger.info(`系统消息分发`)
    }

    async saveRecordAlert(consult_id){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let messageObj = await model.ConsultMessage({
            consult_oid: ObjectId(consult_id),
            from: "system",
            content: "患者完善了就诊信息，请审核"
        }).save();
        return messageObj;
    }

    async updateMessageStatus(message_id, status){
        const {ctx: { model }} = this;
        let messageObj = await model.ConsultMessage.findByIdAndUpdate(
            message_id,
            {
                "$set":{
                    sentStatus: status
                }
            }
        )
        return messageObj;
    }

    async saveVoice({app_id, media_id, consult_id}){
        const {ctx, logger} = this;
        const {token} = await ctx.service.api.callConfigedApi({
            app_id,
            apiName: '获取access_token',
            params: {}
        })
        const result = await ctx.curl(`https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=${token}&media_id=${media_id}`);

        let name = `${ctx.helper.sha1(media_id)}.amr`;
        ctx.helper.saveFile(result.data, name);

        const {messageObj, user_id, patient_id} = await ctx.service.module.message.sendVoice({consult_id, file_name:name});
        return {messageObj, user_id, patient_id};
    }

    async sendVoice({consult_id, file_name}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let consultObj = await model.Consult
        .findById(consult_id)
        .populate(
            {
                path:'doctor_oid',
                populate: {
                    path: 'user_oid'
                }
            }
        )
        .select('doctor_oid patient_oid')
        .lean();

        let messageObj = await model.ConsultMessage({
            consult_oid: ObjectId(consult_id),
            content: `医生:${consultObj.doctor_oid.user_oid.nickname}发来一条[语音]`,
            voice: file_name,
            from: 'doctor',
            subtype:'voice'
        }).save();
        
        return {
            messageObj,
            user_id: consultObj.doctor_oid.user_oid?consultObj.doctor_oid.user_oid._id.toString():consultObj.doctor_oid.consultUser_oid.toString(),
            patient_id: consultObj.patient_oid.toString()
        };
    }
}

module.exports = MessageService;
