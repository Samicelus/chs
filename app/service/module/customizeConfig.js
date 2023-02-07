'use strict';

// app/service/user.js
const Service = require('egg').Service;

class CustomizeConfigService extends Service {
    async setCustomizeConfig({app_id, key, value}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
            app_oid: ObjectId(app_id)
        }
        condition[`config.${key}`] = {
            "$exists": true
        }
        let setter = {
            "$set":{}
        }
        setter["$set"][`config.${key}.value`] = value
        let result = await model.ConsultCustomizeConfig.findOneAndUpdate(
            condition,
            setter
        )
        return result;
    }

    async getCustomizeConfig({app_id, key}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
            app_oid: ObjectId(app_id)
        }
        let result = await model.ConsultCustomizeConfig.findOne(
            condition
        ).lean();
        if(result && result.config && result.config[key]){
            return result.config[key];
        }else{
            return null;
        }
    }
}

module.exports = CustomizeConfigService;
