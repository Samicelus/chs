'use strict';

const {MODULE_MAP, POWER_MAP} = require('../../const/model/admin');
// app/service/user.js
const Service = require('egg').Service;
const crypto = require('crypto');

class userService extends Service {
    async checkAdminExistence() {
        const {ctx: { model, helper }, logger} = this;

        let adminRole = await model.ConsultRole.findOne({isAdmin:true});

        if(!adminRole){
            adminRole = await model.ConsultRole({
                name: "超级管理员",
                access: [],
                isAdmin: true
            }).save();
        }else{
            logger.info(`found admin role: ${adminRole._id}`);
        }

        let admin = await model.ConsultUser.findOne({role_oid:adminRole._id});

        
        if(!admin){
            admin = await model.ConsultUser({
                nickname: "超级管理员",
                username: "admin",
                role_oid: adminRole._id
            }).save();

            admin.password = helper.computeHash("admin", helper.generate16salt(admin._id))
            await admin.save();
            logger.info(`init admin with username: 'admin', password: 'admin'`);
        }else{
            logger.info(`found admin: ${admin._id}`);
        }
    }

    async login(login, password) {
        const {ctx: { model, helper }, app} = this;
        const key = `userLock:${login}`;
        const rst = await app.redis.get(key);
        if(rst && rst>4){
            throw new Error(`max login times error!`);
        }

        //解密username
        const iv1 = Buffer.alloc(16, 0);
        const userSecret = crypto.createHash('sha1').update('runningdoctor').digest('hex').slice(0,24);
        const userDecipher = crypto.createDecipheriv('aes-192-cbc', userSecret, iv1);
        let userDecrypted = userDecipher.update(login, 'hex', 'utf8');
        userDecrypted += userDecipher.final('utf8');

        let user = await model.ConsultUser.findOne({
            username: userDecrypted
        }).populate({
            path:`role_oid`,
            select: `name isAdmin access`
        });
        if(!user){
            return {
                result:false,
                code: '401',
                message: `login/password not correct!`
            }
        }
        const expired = user.expired;
        const now_time = Date.now();
        if(expired && expired<now_time){
            return {
                result:false,
                message: `user expired!`
            }
        }
        const pwd = user.password;

        //使用username为密码解密password
        const iv2 = Buffer.alloc(16, 0);
        const secret = crypto.createHash('sha1').update(userDecrypted).digest('hex').slice(0,24);
        const decipher = crypto.createDecipheriv('aes-192-cbc', secret, iv2);
        let decrypted = decipher.update(password, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const result = helper.comparePassword(decrypted, pwd);

        if(result){
            let payload = {
                user_id: user._id
            }
            let token = helper.generateJWT(payload);
            return {
                result: true,
                token,
                user_id: user._id,
                isAdmin: user.role_oid.isAdmin,
                nickname: user.nickname,
                access: user.role_oid.access
            }
        } else {
            await app.redis.incr(key);
            await app.redis.expire(key, 10*60);
            await model.ConsultUser.findByIdAndUpdate(user._id, {"$set":{"lockedKey":key}});
            return {
                result:false,
                code: '4O1',
                message: `login/password not correct!`
            }
        }
    }

    async getToken(login, password) {
        const {ctx: { model, helper }, app} = this;

        let user = await model.ConsultUser.findOne({
            username: login
        }).populate({
            path:`role_oid`,
            select: `name isAdmin access`
        });
        if(!user){
            return {
                result:false,
                message: `login/password not correct!`
            }
        }
        const expired = user.expired;
        const now_time = Date.now();
        if(expired && expired<now_time){
            return {
                result:false,
                message: `user expired!`
            }
        }
        const pwd = user.password;

        const result = helper.comparePassword(password, pwd);

        if(result){
            let payload = {
                user_id: user._id
            }
            let token = helper.generateJWT(payload);
            return {
                result: true,
                token,
                user_id: user._id,
                isAdmin: user.role_oid.isAdmin,
                nickname: user.nickname,
                access: user.role_oid.access
            }
        } else {
            return {
                result:false,
                message: `login/password not correct!`
            }
        }
    }

    async qywechat({errcode, errmsg, UserId, DeviceId}){
        const {ctx: { model, helper }, app} = this;

        if(errcode){
            return {
                result: false,
                message: errmsg
            }
        }

        let user = await model.User.findById(UserId).lean();

        if(!user){
            return {
                result:false,
                message: `user: ${UserId} not found in corp!`
            }
        }

        let payload = {
            user_id: user._id
        }
        let token = helper.generateJWT(payload);
        return {
            result: true,
            token,
            nickname: user.nickname,
            user_id: user._id
        }
    }

    async changePassword({user_id, password, newPassword}) {
        const {ctx: { model, helper }, app} = this;
        let user = await model.ConsultUser.findById(user_id);
        const pwd = user.password
        const result = helper.comparePassword(password, pwd);

        if(result){
            user.password = helper.computeHash(newPassword, helper.generate16salt(user._id));
            await user.save();
            return {
                result: true
            }
        }else{
            return {
                result: false,
                message: `password not correct!`
            }
        }
    }

    async resetPassword({user_id}){
        const {ctx: { model, helper }} = this;
        let user = await model.ConsultUser.findById(user_id);
        let password = helper.generatePassword();
        user.password = helper.computeHash(password, helper.generate16salt(user._id));
        user.defaultPwd = password;
        await user.save();
        return {
            result:true,
            password: password
        }
    }

    async listRoles(){
        const {ctx: { model}} = this;
        let list = await model.ConsultRole.find({});
        return {
            result:true,
            list
        }
    }

    async addRole({name, access=[{module:"config",power:["create","modify","delete","view"]}]}){
        const {ctx: { model}} = this;
        let role = await model.ConsultRole({
            name,
            access
        }).save();
        return {
            result:true,
            role
        }
    }

    async addUser({username, role_id}){
        const {ctx: { model, helper }, app:{mongoose: {Types: { ObjectId }}}} = this;
        let user = await model.ConsultUser({
            role_oid: ObjectId(role_id),
            nickname: username,
            username
        }).save();

        let password = helper.generatePassword();

        user.password = helper.computeHash(password, helper.generate16salt(user._id));
        user.defaultPwd = password;
        await user.save();
        return {
            result:true,
            username,
            password: password
        }
    }

    async setUserRole({user_id, role_id}){
        const {ctx: { model }, app:{mongoose: {Types: { ObjectId }}}} = this;
        let user = await model.ConsultUser.findByIdAndUpdate(user_id, {
            "$set": {
                role_oid: ObjectId(role_id)
                }
            },
            {
                new: true
            });
        return {
            user
        }
    }

    async listUsers({search, page, pageSize, sortField, sortOrder}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
        };
        if(search){
            condition["$or"] = [];
            condition["$or"].push({
                username: {"$regex": search}
            });
            condition["$or"].push({
                nickname: {"$regex": search}
            });
        }
        let sort = {
            "created": -1
        }
        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;  
        }

        const list = await model.ConsultUser.find(condition)
        .select(`nickname role_oid scope_oid created defaultPwd`)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .populate({
            path:'scope_oid'
        })
        .populate({
            path: 'role_oid',
            select: 'name access isAdmin'
        })
        .lean();
        let count = await model.ConsultUser.count(condition);
        return {list, count};
    }

    async modifyUserScope({user_id, scope}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let userScope = await model.ConsultUserScope.findOne({
            user_oid: Object(user_id)
        });
        if(!userScope){
            userScope = await model.ConsultUserScope({
                user_oid: Object(user_id),
                scope: []
            }).save();
            await model.ConsultUser.findByIdAndUpdate(user_id,{"$set":{
                scope_oid: userScope._id
            }});
        }

        scope.forEach(item=>{
            if(item.company_oid){
                item.company_oid = ObjectId(item.company_oid);
            }
        })

        userScope.scope = scope;

        userScope.markModified('scope');
        await userScope.save();
        return {
            result: true
        }
    }

    async checkUserScope({app_id, hospitalId, userInfo}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let {_id, isAdmin} = userInfo;
        if(isAdmin){
            return true;
        }else{
            let userScope = await model.ConsultUserScope.findOne({
                user_oid: Object(_id)
            });
            if(!userScope){
                return false;
            }
            if(app_id){
                let appConfig = await model.AppConfig.findById(app_id).lean();
                hospitalId =  appConfig.company?appConfig.company.hospitalId:"";
            }
            if(hospitalId){
                return userScope.scope.map(item=>item.hospitalId).includes(hospitalId);
            }else{
                return false;
            }
        }
    }

    async getModuleMap(){
        return MODULE_MAP;
    }

    async getPowerMap(){
        return POWER_MAP;
    }

    async getUserInfo({company_id, app_id, code}){
        const {ctx:{helper}} = this;
        let access_token = await helper.getAccessToken(company_id, app_id);

        let url = `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${access_token}&code=${code}`;

        let result = (await this.ctx.curl(url,
            {
                method: 'GET',
                dataType: 'json'
            }
        )).data;

        return result;
    }
}

module.exports = userService;