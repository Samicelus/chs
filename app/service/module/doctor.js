'use strict';

// app/service/user.js
const Service = require('egg').Service;

class DoctorService extends Service {
    async addDoctor({app_id, company_id, user_id, profile, 
    consultTypes={
        text: {
            isOpen: false,
            isAvailable: false,
            price: 1,
            push: {
                pushType: 'immediate'
            }
        },
        phone: {
            isOpen: false,
            isAvailable: false,
            price: 1
        },
        video: {
            isOpen: false,
            isAvailable: false,
            price: 1
        }
    }, 
    hisPower = {
        hisId: "",
        canGiveAdvice: false,
        canGiveLab: false,
        canGivePicture: false,
        canGiveRecord: false,
    }, 
    CA = {
        state: "-1",
        idCard: "",
        professionIdType: "YS",
        professionId: ""
    }}){
        const {ctx: { model, helper }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let appConfig;
        if(app_id){
            appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        }
        
        profile.department_oid = ObjectId(profile.department_id)
        delete profile.department_id;

        //验证组织架构中是否有该成员
        let companyUserObj = await model.CompanyUser.findOne({
            company_id: app_id?appConfig.company_oid.toString():company_id,
            user_id
        }).lean();
        
        if(!companyUserObj){
            return {
                result: false,
                message: `组织 ${app_id?appConfig.company_oid.toString():company_id} 中, 未找到成员 ${user_id}`
            }
        }

        logger.info(profile);

        let setter = {
            company_oid: app_id?appConfig.company_oid:ObjectId(company_id),
            user_oid: ObjectId(user_id),
            ...helper.flattenPath({profile}),
            ...helper.flattenPath({consultTypes}),
            ...helper.flattenPath({hisPower}),
            ...helper.flattenPath({CA}),
        }

        logger.info(setter);

        let result = await model.ConsultDoctor.update(
            {
                company_oid: app_id?appConfig.company_oid:ObjectId(company_id),
                user_oid: ObjectId(user_id)
            },
            {
                "$set":setter
            },
            {
                "upsert":true
            }
        )

        let doctor = await model.ConsultDoctor.findOne(
            {
                company_oid: app_id?appConfig.company_oid:ObjectId(company_id),
                user_oid: ObjectId(user_id)
            }
        ).lean();

        let doctor_app_id
        if(app_id){
            doctor_app_id = app_id;
        }else{
            doctor_app_id = (await model.AppConfig.findOne({
                company_oid: ObjectId(company_id)
            }).select('_id').lean())._id;
        }

        return {
            result: true,
            doctor_app_id, 
            doctor_id: doctor._id
        }
    }


    async getDoctors({department_id, app_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        let condition = {company_oid: appConfig.company_oid};
        if(department_id){
            condition['profile.department_oid'] = ObjectId(department_id);
        }
        let list = await model.ConsultDoctor.find(condition).populate('user_oid').populate('consultUser_oid').lean();
        for(let index in list){
            let doctor = list[index];
            let comments = await model.ConsultComment.find({
                doctor_oid: doctor._id,
                state: 'normal'
            }).select('score').lean();
            if(comments.length){
                let sum = comments.reduce((total, item)=>{
                    return total + item.score;
                }, 0);
                doctor.score = Math.ceil(sum / comments.length);
            }
        }
        return list;
    }

    async addDepartment({app_id, department}){
        const {ctx: { model }} = this;
        let appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        let departmentObj = await model.ConsultDepartment({
            ...department,
            company_oid: appConfig.company_oid
        }).save();
        return {departmentObj};
    }

    async updateDepartment({department_id, name, description}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let setter = {};
        if(name){
            setter["name"] = name;
        }
        if(description){
            setter["description"] = description;
        }

        let department = await model.ConsultDepartment.findByIdAndUpdate(department_id,{
            "$set": setter
        })
        return {department};
    }

    async removeDepartment({department_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        await model.ConsultDoctor.updateMany(
            {
                "profile.department_oid": ObjectId(department_id)
            },
            {
                "$unset": {
                    "profile.department_oid": ""
                }
            },
            {
                multi:true
            }
        )
        let departmentObj = await model.ConsultDepartment.findByIdAndRemove(department_id);
        return {departmentObj};
    }

    async listDepartment({app_id, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }} = this;
        let appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        let condition = {company_oid: appConfig.company_oid};
        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;  
        }

        let list = await model.ConsultDepartment.find(condition)
        .populate({
            path: 'company_oid',
            select: 'company_name'
        })
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        for(let index in list){
            let group = list[index];
            group.count = await model.ConsultDoctor.count({
                "profile.department_oid": group._id
            });
        }

        let count = await model.ConsultDepartment.count(condition);

        return {list, count};
    }

    async listDoctor({app_id, search, department_ids, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        let condition = {company_oid: appConfig.company_oid};

        if(search){
            let userCondition = {
                nickname: {"$regex": search},
                company_id: appConfig.company_oid.toString()
            }
            let user_oids = await model.CompanyUser.distinct('user_id', userCondition);
            
            let consultUserCondition = {
                nickname: {"$regex": search}
            }
            let consultUser_oids = await model.ConsultUser.distinct('_id',consultUserCondition);

            if(!condition["$or"]){
                condition["$or"] = [];
            }
            condition["$or"].push({"user_oid":{"$in": user_oids.map(item=>ObjectId(item))}});
            condition["$or"].push({"consultUser_oid":{"$in": consultUser_oids}});
            condition["$or"].push({"hisPower.hisId": {"$regex": search}});
        }

        if(department_ids){
            condition["profile.department_oid"] = {"$in": JSON.parse(department_ids).map(item=>ObjectId(item))}
        }

        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;  
        }

        let list = await model.ConsultDoctor.find(condition)
        .populate({
            path: 'profile.department_oid',
            select: 'name'
        })
        .populate({
            path: 'user_oid'
        })
        .populate({
            path: 'consultUser_oid'
        })
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        list.forEach(item=>{
            if(!item.user_oid){
                item.user_oid = item.consultUser_oid;
            }
        })

        let count = await model.ConsultDoctor.count(condition);

        return {list, count};
    }

    async updateDoctor({doctor_id, department_id, property, description, profession, sections, canGiveAdvice, canGiveLab, canGivePicture, canGiveRecord, idCard, professionIdType, professionId, textOpen, textPrice, phoneOpen, phonePrice, videoOpen, videoPrice, hisId}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let setter = {};
        if(department_id){
            setter["profile.department_oid"] = ObjectId(department_id)
        }
        if(property){
            setter["profile.property"] = property;
        }
        if(description){
            setter["profile.description"] = description;
        }
        if(profession){
            setter["profile.profession"] = profession;
        }
        if(sections){
            setter["profile.sections"] = sections;
        }
        if(canGiveAdvice){
            setter["hisPower.canGiveAdvice"] = (canGiveAdvice == 'true'?true:false);
        }
        if(canGiveLab){
            setter["hisPower.canGiveLab"] = (canGiveLab == 'true'?true:false);
        }
        if(canGivePicture){
            setter["hisPower.canGivePicture"] = (canGivePicture == 'true'?true:false);
        }
        if(canGiveRecord){
            setter["hisPower.canGiveRecord"] = (canGiveRecord == 'true'?true:false);
        }
        if(idCard){
            setter["CA.idCard"] = idCard;
        }
        if(professionIdType){
            setter["CA.professionIdType"] = professionIdType;
        }
        if(professionId){
            setter["CA.professionId"] = professionId;
        }
        if(textOpen){
            setter["consultTypes.text.isOpen"] = (textOpen == 'true'?true:false);
        }
        if(textPrice){
            setter["consultTypes.text.price"] = Number(textPrice);
        }
        if(phoneOpen){
            setter["consultTypes.phone.isOpen"] = (phoneOpen == 'true'?true:false);
        }
        if(phonePrice){
            setter["consultTypes.phone.price"] = Number(phonePrice);
        }
        if(videoOpen){
            setter["consultTypes.video.isOpen"] = (videoOpen == 'true'?true:false);
        }
        if(videoPrice){
            setter["consultTypes.video.price"] = Number(videoPrice);
        }
        if(hisId){
            setter["hisPower.hisId"] = hisId;
        }

        let doctor = await model.ConsultDoctor.findByIdAndUpdate(doctor_id,{
            "$set": setter
        })
        return {doctor};
    }

    async listCompanyUser({app_id, search}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let appConfig = await model.AppConfig.findById(app_id).select('company_oid').lean();
        let condition = {
            company_id: appConfig.company_oid.toString(),
            nickname: {"$exists": true}
        }
        if(search){
            condition.nickname["$regex"] = search;
        }
        let list = await model.CompanyUser.find(condition).select('user_id nickname phoneno').lean();
        return {list};
    }
}

module.exports = DoctorService;
