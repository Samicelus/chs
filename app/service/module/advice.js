'use strict';

// app/service/user.js
const Service = require('egg').Service;

class AdviceService extends Service {
    /**
    * 同步药品:
    * 获取app所属医院 --> 替换同步到的药品 --> 将未同步到且在数据库中的药品设为不可用
    * @param {String} app_id   在线问诊app_id 
    * @param {Array} medicines 本次同步的药品
    */
    async updateMedicines({app_id, medicines}) {
        const {ctx: { model }} = this;
        let appConfigObj = await model.AppConfig.findById(app_id)
            .select('company_oid').lean();
        let enabled = [];
        //插入或更新已同步的药品
        for(let medicine of medicines){
            medicine.company_oid = appConfigObj.company_oid;
            medicine.disabled = false;
            await model.ConsultMedicine.updateOne({
                company_oid: medicine.company_oid,
                hisMedicine: medicine.hisMedicine,
                branchCode: medicine.branchCode
            },
            {"$set":{...medicine}},
            {
                upsert: true
            }
            );
            //记录已同步药品
            enabled.push(`${medicine.company_oid}:${medicine.branchCode}:${medicine.hisMedicine}`);
        }
        //将未同步的旧药品设为不可用
        await model.ConsultMedicine.updateMany({
                company_oid: appConfigObj.company_oid,
                uniqKey: {
                    "$nin": enabled
                }
            },
            {
                "$set": {
                    disabled: true
                }
            }
        );

        return;
    }


    /**
     * 根据药品code查询药品_id
     * @param {String} app_id 应用id
     * @param {String} hisMedicine 药品code
     */
    async getIdByHisMedicine({app_id, hisMedicine}){
        const {ctx: { model }} = this;
        let appConfigObj = await model.AppConfig.findById(app_id)
        .select(`company_oid`).lean();
        let medicine = await model.ConsultMedicine.findOne({
            hisMedicine,
            company_oid: appConfigObj.company_oid
        })
        .select('_id').lean();
        return medicine._id;
    }


    /**
     * 搜索药品
     * @param {String} app_id   应用id
     * @param {String} keyWord  搜索药品关键词
     */
    async listMedicines({app_id, keyWord}) {
        const {ctx: { model }} = this;
        let appConfigObj = await model.AppConfig.findById(app_id)
        .select('company_oid').lean();
        let condition = {
            company_oid: appConfigObj.company_oid,
            disabled: false
        }
        if(keyWord){
            condition["$or"] = [
                {
                    hisMedicineDesc: {
                        "$regex": keyWord
                    }
                },
                {
                    hisMedicineAlias: {
                        "$regex": keyWord
                    }
                }
            ];
        }
        let list = await model.ConsultMedicine.find(condition).lean();
        return {list};
    }

    /**
     * 保存处方
     * @param {String} consult_id       咨询单id
     * @param {Array} advices           所开药品
     * @param {String} diagnosis        诊断
     * @param {String} diagnosisType    诊断类型
     * @param {String} notes            备注
     */
    async createAdvice({consult_id, advices, diagnosis, diagnosisType, notes}) {
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const consultObj = await model.Consult.findById(consult_id)
        .populate({path: `doctor_oid`, select:`hisPower.hisId`})
        .select(`doctor_oid`).lean();
        advices.forEach(item=>{
            item.medicine_oid = ObjectId(item.medicine_id);
            delete item.medicine_id;
        })
        let advice = {
            consult_oid: ObjectId(consult_id),
            hisId: consultObj.doctor_oid?consultObj.doctor_oid.hisPower.hisId:"",
            diagnosis,
            diagnosisType,
            notes,
            advices,
            CA: {}
        }
        let adviceObj = await model.ConsultAdvice(advice).save();
        return {advice: adviceObj};
    }

    /**
     * 获取咨询单下已保存的处方
     * @param {String} consult_id 咨询单
     */
    async listAdvices({consult_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const list = await model.ConsultAdvice.find({
            consult_oid: ObjectId(consult_id)
        }).populate('advices.medicine_oid').lean();
        return {list};
    }

    async getWaitAdvice({consult_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const advice = await model.ConsultAdvice.findOne({
            consult_oid: ObjectId(consult_id),
            sentState: 'wait'
        }).populate('advices.medicine_oid').lean();
        return {advice};
    }

}

module.exports = AdviceService;
