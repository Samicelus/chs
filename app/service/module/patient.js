'use strict';

// app/service/user.js
const Service = require('egg').Service;

class PatientService extends Service {
    /**
     * 保存患者信息，如果有_id则找出该患者，否则根据identityCard找到患者，如果未在
     * 数据库中找到患者，则新建并保存该患者。接下来保存患者就诊卡信息，如果在患者卡信息
     * 中找到同样的卡号则使用该卡号对应数据，否则保存卡数据到cards字段中并使用该卡号
     * @return {ObjectId} patient_id 患者id
     * @return {String} cardNo 就诊卡号
     * @param {Object} patient 患者信息
     * @param {Object} cardInfo 患者的就诊卡信息
     */
    async savePatient(patient, cardInfo){
        const {ctx: { model }} = this;
        let patientObj;
        if(patient._id){
            patientObj = await model.ConsultPatient.findById(patient._id);
        }else{
            const { profile:{identityCard} } = patient;
            patientObj = await model.ConsultPatient.findOne({"profile.identityCard":identityCard});
        }
        if(!patientObj){
            patientObj = await model.ConsultPatient({
                emtId: patient.emtId,
                profile: {
                    identityCard: patient.profile.identityCard,
                    name: patient.profile.name,
                    phone: patient.profile.phone
                },
                cards:{}
            }).save();
        }
        if(cardInfo && !patientObj.cards[cardInfo.cardNo]){
            patientObj.cards[cardInfo.cardNo] = cardInfo;
            patientObj.markModified('cards');
            patientObj.save();
        }

        return {
            patient_id: patientObj._id,
            cardNo: cardInfo?cardInfo.cardNo:""
        }
        
    }
}

module.exports = PatientService;
