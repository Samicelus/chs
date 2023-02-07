'use strict';
const _ = require('lodash');
const moment = require('moment');
const querystring = require('querystring');
moment.locales('zh-cn');
// app/service/api.js
const Service = require('egg').Service;

class BoxService extends Service {

    async getAppHospitalId({app_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        const app = await model.AppConfig.findById(app_id).select("company").lean();
        if(app && app.company){
            return {result: true, hospitalId: app.company.hospitalId}
        }else{
            return {result: false}
        }
    }

    /**
     * 
     * 获取医院下的box
     * 
     * @param {String}      hospitalId 
     * @param {String}      search 
     */
    async listHospitalBoxes ({hospitalId, search}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let condition = {
            "company.hospitalId": hospitalId
        };
        
        if(search){
            condition.name = {"$regex":search}
        }

        const list = await model.Box.find(condition)
        .populate({
            path: 'tag_oid',
            select: 'description tagName'
        })
        .select(`_id name tag_oid`)
        .lean();

        return {list};
    }

    /**
     * 获取box详情
     * 
     * @param {String} box_id 2.0版本黑盒id
     */
    async getBoxDetail({box_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let box = await model.Box.findById(box_id).lean();
        return {box};
    }

    async updateBox({box_id, box}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        let boxData = await model.Box.findByIdAndUpdate(box_id, box, {upsert:true, new: true});
        return {box: boxData};
    }

    async createBox({app_id, name, tag_id}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let appConfig = await model.AppConfig.findById(app_id).select('company').lean();

        if(!appConfig || !appConfig.company){
            throw new Error(`未找到app_id: ${app_id} 的应用或该应用未设置所属医院`)
        }

        let box = await model.Box({
            company: appConfig.company,
            tag_oid: ObjectId(tag_id),
            name,
            topology: {
                blocks:{
                }
            }
        }).save();

        return {box};
    }
}

module.exports = BoxService;