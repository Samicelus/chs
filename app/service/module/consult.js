'use strict';

// app/service/user.js
const Service = require('egg').Service;

class ConsultService extends Service {
    /**
     * 建立新咨询
     * @param {String} app_id       咨询对应的应用id 
     * @param {String} doctor_id    咨询对应的医生id
     * @param {String} patient_id   咨询对应的患者id
     * @param {Object} complaint    患者主诉
     * @param {String} record_id    此次咨询所用的就诊记录id,如果没有则为空
     * @param {String} subject_id   患者端咨询单号，用于同步
     */
    async createConsult(app_id, doctor_id, patient_id, complaint, record_id, cardNo, subject_id) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}, redis}} = this;
        let consult = {
            app_oid: ObjectId(app_id),
            doctor_oid: ObjectId(doctor_id),
            patient_oid: ObjectId(patient_id),
            usedCard: cardNo,
            complaint,
            subjectId: subject_id
        };
        if(record_id){
            consult.record_oid = ObjectId(record_id);
        }
        let consultObj = await model.Consult(consult).save();
        consultObj = await model.Consult.findById(consultObj._id).populate('app_oid').lean();
        let key = `subject:${consultObj.app_oid.company_oid}-${subject_id}`;
        await redis.del(key);

        let doctorObj = await model.ConsultDoctor.findById(doctor_id).select('user_oid').lean();
        return {
            consultObj,
            user_id: doctorObj.user_oid?doctorObj.user_oid.toString():doctorObj.consultUser_oid?doctorObj.consultUser_oid.toString():''
        };
    }

    async renewConsultRecord(consult_id, record_id){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let consultObj = await model.Consult.findByIdAndUpdate(
            consult_id,
            {
                "$set":{
                    record_oid: ObjectId(record_id)
                }
            }
        );
        return consultObj;
    }

    /**
     * 医生端获取咨询列表
     * @param {user_id} 医生端用户id
     * @param {app_id} 咨询应用id
     * @param {type} 咨询状态： wait-待回复 ongoing-进行中 finish-已结束
     */
    async listConsults({user_id, app_id, type}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        let doctor = await model.ConsultDoctor.findOne({
            "$or": [
                {user_oid: ObjectId(user_id)},
                {consultUser_oid: ObjectId(user_id)}
            ],
            company_oid: appConfig.company_oid
        }).select('_id').lean();

        if(!doctor){
            return {
                result:false,
                message: `no doctor found with correspond user: ${user_id}`
            }
        }

        let condition = {
            app_oid: ObjectId(app_id),
            doctor_oid: doctor._id
        }

        switch(type){
            case 'wait':
                condition.isClosed = false;
                condition.isCanceled = false;
                break;
            case 'ongoing':
                condition.isClosed = false;
                condition.isCanceled = false;
                break;
            case 'finish':
                condition["$or"] = [
                    {
                        isClosed: true
                    },
                    {
                        isCanceled: true
                    }
                ]
                break;
            default:
                break;
        }

        let list = await model.Consult.find(condition).populate('patient_oid').sort({created:-1}).lean();

        let messageCountObj={};
        let message_count = [];
        switch(type){
            case 'wait':
                message_count = await model.ConsultMessage.aggregate([
                    {
                        "$match":{
                            consult_oid: {"$in":list.map(item=>item._id)},
                            read: {"$ne": true},
                            from: {"$in":["patient","system"]}
                        }
                    },
                    {
                        "$group":{
                            "_id": "$consult_oid",
                            "count": {"$sum":1}
                        }
                    }
                ]);
                message_count.forEach((item)=>{
                    messageCountObj[item._id] = item.count;
                })
                list = list.filter((item)=>{
                    let temp = false;
                    if(messageCountObj[item._id.toString()]){
                        temp = true;
                        item.count = messageCountObj[item._id.toString()];
                    }
                    return temp;
                })
                break;
            case 'ongoing':
                message_count = await model.ConsultMessage.aggregate([
                    {
                        "$match":{
                            consult_oid: {"$in":list.map(item=>item._id)},
                            read: {"$ne": true},
                            from: {"$in":["patient","system"]}
                        }
                    },
                    {
                        "$group":{
                            "_id": "$consult_oid",
                            "count": {"$sum":1}
                        }
                    }
                ]);
                message_count.forEach((item)=>{
                    messageCountObj[item._id] = item.count;
                })
                list = list.filter((item)=>{
                    return !messageCountObj[item._id.toString()]
                })
                break;
            case 'finish':
                break;
            default:
                break;
        }

        return {
            result: true,
            list
        };
    }

    /**
     * 患者端获取咨询列表
     * @param {identityCard} 患者身份证号
     * @param {cardNo} 患者就诊卡号
     */
    async listMyConsults({patient_id}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        if(!patient_id){
            return {
                result:false,
                message: `no patient_id is provided`
            }
        }

        let condition = {};

        condition.patient_oid = ObjectId(patient_id); 

        let list = await model.Consult.find(condition).populate({
                path:'doctor_oid',
                populate: {
                    path:'user_oid'
                }
            })
            .populate({
                path:'doctor_oid',
                populate: {
                    path:'consultUser_oid'
                }
            })
            .sort({created:-1}).lean();

        let messageCountObj={};
        let message_count = await model.ConsultMessage.aggregate([
            {
                "$match":{
                    consult_oid: {"$in":list.map(item=>item._id)},
                    read: {"$ne": true},
                    from: {"$in":["doctor","system"]}
                }
            },
            {
                "$group":{
                    "_id": "$consult_oid",
                    "count": {"$sum":1}
                }
            }
        ]);
        message_count.forEach((item)=>{
            messageCountObj[item._id] = item.count;
        })
        list.forEach((item)=>{
            if(messageCountObj[item._id.toString()]){
                item.count = messageCountObj[item._id.toString()];
            }
        })

        return {
            result: true,
            list
        };
    }

    /**
     * 获取咨询单详情，关联咨询单的医生，患者详情，就诊记录详情，
     * 从患者详情中选取就诊记录并抽出
     * @param {String} consult_id 
     */
    async getConsultDetail(consult_id) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let consultObj = await model.Consult.findById(consult_id)
        .populate({
            path: 'doctor_oid',
            populate: {
                path: 'user_oid'
            }
        })
        .populate({
            path: 'patient_oid'
        })
        .populate({
            path: 'record_oid'
        })
        .populate({
            path: 'consultComment_oid'
        })
        .lean();
        consultObj.usedCard = consultObj.patient_oid.cards[consultObj.usedCard];
        delete consultObj.patient_oid.cards;
        return consultObj;
    }

    async setRenewed(consult_id){
        const {app: {redis}} = this;
        let key = `consultDetail:${consult_id}`
        await redis.set(key, new Date().getTime());
        return true; 
    }

    async setListRenewed({user_id, patient_id}){
        const {app: {redis}} = this;
        if(user_id){
            let doctorKey = `consultListDoctor:${user_id}`
            await redis.set(doctorKey, new Date().getTime());
        }
        if(patient_id){
            let patientKey = `consultListPatient:${patient_id}`
            await redis.set(patientKey, new Date().getTime());
        }
        return true; 
    }

    async closeConsult(consult_id) {
        const {ctx: { model }} = this;
        await model.Consult.findByIdAndUpdate(
            consult_id,
            {
                $set:{
                    isClosed: true
                }
            }
        );
        let consultObj = await model.Consult
        .findById(consult_id)
        .populate('doctor_oid')
        .select('doctor_oid patient_oid')
        .lean();
        if(consultObj){
            return {
                result: true,
                user_id: consultObj.doctor_oid.user_oid?consultObj.doctor_oid.user_oid.toString():consultObj.doctor_oid.consultUser_oid?consultObj.doctor_oid.consultUser_oid.toString():'',
                patient_id: consultObj.patient_oid.toString()
            };
        }else{
            return {
                result: false
            }
        }
        
    }

    async commentConsult({consult_id, comments, score, anonymous}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let consult = await model.Consult.findOne({
            _id: ObjectId(consult_id),
            isClosed: true
        });
        let comment = await model.ConsultComment.findOne({
            consult_oid: ObjectId(consult_id)
        })
        if(!comment && consult){
            comment = await model.ConsultComment({
                consult_oid: ObjectId(consult_id),
                doctor_oid: consult.doctor_oid,
                patient_oid: consult.patient_oid,
                comments,
                score,
                anonymous
            }).save();
            consult.consultComment_oid = comment._id;
            await consult.save();
        }
        return {comment};
    }

    async afterCloseConsult(){
        //TODO 发送事件，触发如向医生患者发消息
    }
}

module.exports = ConsultService;
