'use strict';

// app/service/user.js
const Service = require('egg').Service;

class CommunicationService extends Service {

    //对咨询单检查去重
    async checkSubject({subject_id, company_id}){
        const {ctx: { model, helper }, logger, app: {mongoose: {Types: { ObjectId }}, redis}} = this;
        let result = true;
        let message;
        let key = `subject:${company_id}-${subject_id}`;
        let locked = await redis.get(key);
        if(locked){
            result = false;
            logger.info(`locked:${key} [${locked}]`)
            message = '咨询单创建中';
        }
        await redis.setnx(key, 1);

        let company_apps = await model.AppConfig.distinct('_id', {
            company_oid: ObjectId(company_id)
        })

        let consultObject = await model.Consult.findOne({
            app_oid: {"$in": company_apps},
            subjectId: subject_id
        })

        if(consultObject){
            result = false;
            message = '咨询单已存在';
            await redis.del(key);
        }

        return {
            result,
            message
        }
    }

    async verifyDoctor({doctor_id, company_id}){
        const {ctx: { model, helper }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let result = false;

        let appConfigObj = await model.AppConfig.findOne({
            company_oid: ObjectId(company_id)
        }).lean();

        if(!appConfigObj){
            return {
                result,
                message: `未找到医院: ${company_id} 对应应用`
            };
        }

        let doctor = await model.ConsultDoctor.findOne({
            company_oid: ObjectId(company_id),
            user_oid: ObjectId(doctor_id)
        });

        if(doctor){
            result = true;
            return {
                result,
                doctor_id: doctor._id,
                app_id: appConfigObj._id
            };
        }else{
            return {
                result,
                message: `未找到: ${doctor_id} 对应医生`
            };
        }

        
    }

    /**
     * 搜索医生
     * 分两种情况: 
     * 1.需要对开通医生信息进行筛选的: 结果中只可能包含consultDoctor表内容, 查询 consultDoctor表并做分页
     *      查询条件: is_recommended, out_id
     * 2.不需要对开通医生信息进行筛选的: 结果中可能包含companyUser表内容, 查询company_user表并做分页，对分页内容中开通的医生再进行替换
     * @param {*} param0 
     */
    async searchDoctor({page, pageSize, company_id, nickname, is_recommended, tuishiben_id, group_id, out_id}){
        const {ctx: { model, helper }, logger, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        if(is_recommended || out_id){
            //情况1.
            let consultDoctorCondition = {
                company_oid: ObjectId(company_id)
            }

            if(is_recommended){
                consultDoctorCondition.isRecommended = (is_recommended === "on");
            }
            
            if(out_id){
                consultDoctorCondition["profile.department_oid"] = ObjectId(out_id);
            }
            
            if(nickname || tuishiben_id || group_id){
                let user_ids = [];

                if(nickname || tuishiben_id){
                    let userCondition = {
                        company_id
                    }
                    if(nickname){
                        userCondition.nickname = {"$regex": nickname}
                    }
                    if(tuishiben_id){
                        userCondition.employee_id = {"$regex": tuishiben_id}
                    }
                    user_ids = user_ids.concat(await model.CompanyUser.distinct('user_id', userCondition))
                }

                if(group_id){
                    let groupCondition = {
                        company_id,
                        group_id
                    }
                    user_ids = user_ids.concat(await model.GroupUser.distinct('user_id', groupCondition))
                }

                consultDoctorCondition.user_oid = {"$in": user_ids.map(item=>ObjectId(item))};
            }

            let list = await model.ConsultDoctor.find(consultDoctorCondition)
                .populate('user_oid')
                .populate('profile.department_oid')
                .skip((Number(page)-1)*Number(pageSize))
                .limit(Number(pageSize))
                .lean()
            let count = await model.ConsultDoctor.count(consultDoctorCondition)
            return {list:list.map(item=>consultDoctor2communicationDoctor(item)), count}
        }else{
            //情况2.
            let companyUserCondition = {
                company_id
            }
            if(nickname || tuishiben_id){
                if(nickname){
                    companyUserCondition.nickname = {"$regex": nickname}
                }
                if(tuishiben_id){
                    companyUserCondition.employee_id = {"$regex": tuishiben_id}
                }   
            }

            if(group_id){
                let groupCondition = {
                    company_id,
                    group_id
                }
                user_ids = user_ids.concat(await model.GroupUser.distinct('user_id', groupCondition))
                companyUserCondition.user_id = {
                    "$in": user_ids
                }
            }

            logger.info(JSON.stringify(companyUserCondition));

            let list = await model.CompanyUser.find(companyUserCondition)
                .skip((Number(page)-1)*Number(pageSize))
                .limit(Number(pageSize))
                .lean()
            let count = await model.CompanyUser.count(companyUserCondition)
            //组合consultDoctor表中内容
            
            let user_ids = list.map(item=>item.user_id);
            let doctorCondition = {
                user_oid: {"$in": user_ids.map(item=>ObjectId(item))},
                company_oid: ObjectId(company_id)
            }
            let doctors = await model.ConsultDoctor.find(doctorCondition)
            .populate('user_oid')
            .populate('profile.department_oid')
            .lean();
            let result = [];
            list.forEach(user=>{
                let replaced = false;
                for(let doctor of doctors){
                    if(!replaced && doctor.user_oid._id && user.user_id == doctor.user_oid._id.toString()){
                        result.push(consultDoctor2communicationDoctor(doctor));
                        replaced = true;
                    }
                }
                if(!replaced){
                    result.push(user);
                }
            })
            return {list:result, count}
        }
    }

    /**
     * 修改医生信息后通知患者端
     */
    async afterSaveDoctor({app_id, doctor_id}){
        const {ctx: { model }} = this;

        await model.ConsultDoctor.findByIdAndUpdate(
            doctor_id,
            {
                "$set": {
                    "synchronized": false
                }
            }
        );

        let {result} = await this.ctx.service.api.callConfigedApi({
            app_id,
            apiName: '向患者端同步医生信息',
            params:{
                consultDoctor_id: doctor_id
            }
        });

        if(result){
            await model.ConsultDoctor.findByIdAndUpdate(
                doctor_id,
                {
                    "$set": {
                        "synchronized": true
                    }
                }
            );
        }
        
    }

}

function consultDoctor2communicationDoctor(obj){
    return {
        CA_state: obj.CA.state,
        avatar: obj.user_oid.avatar,
        can_give_advice: obj.hisPower.canGiveAdvice,
        can_give_lab: obj.hisPower.canGiveLab,
        can_give_record: obj.hisPower.canGiveRecord,
        company_id: obj.company_id,
        description: obj.profile.description,
        group_for_patient: obj.profile.department_oid?obj.profile.department_oid.name:"",
        group_name: "",
        his_id: obj.hisPower.hisId,
        is_recommended: obj.isRecommended?"on":"off",
        nickname: obj.user_oid.nickname,
        phone: obj.user_oid.phones[0],
        price_phone: obj.consultTypes.phone.price,
        price_text: obj.consultTypes.text.price,
        price_video: obj.consultTypes.video.price,
        profession: obj.profile.profession,
        push_type: obj.consultTypes.text.push?obj.consultTypes.text.push.pushType: 'immediate',
        sections: obj.profile.sections,
        service: obj.consultTypes.text.isOpen?"on":"off",
        service_phone: obj.consultTypes.phone.isOpen?"on":"off",
        service_video: obj.consultTypes.video.isOpen?"on":"off",
        status: obj.consultTypes.text.isAvailable?"on":"off",
        status_phone: obj.consultTypes.phone.isAvailable?"on":"off",
        status_video: obj.consultTypes.video.isAvailable?"on":"off",
        tuishiben_id: obj.user_oid.employee_id,
        user_id: obj.user_oid._id
    }
}


module.exports = CommunicationService;
