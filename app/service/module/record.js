'use strict';
const { STATUS_MAP } = require('../../../const/model/record');
// app/service/user.js
const Service = require('egg').Service;

class RecordService extends Service {
    /**
     * 保存患者就诊记录，如果有_id,则从数据库中找到该条并返回该条_id，否则报错并返回
     * @return {ObjectID} record_id 保存的就诊记录id
     * @param {Object} record   就诊记录
     * @param {String}} patient_id   患者id 
     */
    async saveRecord(record, patient_id){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let recordObj;
        if(patient_id){
            record.patient_id = patient_id;
        }
        if(record._id){
            recordObj = await model.ConsultRecord.findById(record._id);
        }
        if(!recordObj){
            recordObj = await model.ConsultRecord({
                patient_oid: ObjectId(record.patient_id),
                hospital: record.hospital,
                date: record.date,
                department: record.department,
                doctor: record.doctor,
                diagnosis: record.diagnosis,
                pic: record.pic,
                status: "wait"
            }).save()
        }
        return {
            record_id: recordObj._id
        }
    }

    /**
     * 患者获取已保存就诊记录
     * @param {String} patient_id 患者id 
     */
    async getRecords(patient_id){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const list = await model.ConsultRecord.find({
            patient_oid: ObjectId(patient_id)
        }).lean();
        return {list};
    }

    /**
     * 获取待审核的就诊记录详情
     * @param {String} consult_id 
     */
    async getRecordDetail(consult_id){
        const {ctx: { model }} = this;
        const {record_oid} = await model.Consult.findById(consult_id);
        const recordObj = await model.ConsultRecord.findById(record_oid);
        return {
            record: recordObj
        }
    }

    /**
     * 改变咨询单中就诊记录状态为已审核
     * @param {String} consult_id 咨询单id
     */
    async authRecord(consult_id){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let consultObj = await model.Consult.findByIdAndUpdate(
            consult_id,
            {
                "$set":{
                    recordAuthed: true
                }
            }
        );
        return {
            consult: consultObj
        }
    }
}

module.exports = RecordService;
