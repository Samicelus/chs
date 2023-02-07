'use strict';
const mongoose = require('mongoose');
const mysql = require('mysql');
const moment = require('moment');
moment.locale('zh-cn');
const Service = require('egg').Service;

class dataAnalyseService extends Service {

    async analyseCollection({source_id, model_id}){
        const {ctx: { helper }} = this;

        let {retModel, conn, name, modelSchema} = await helper.customizeModel({
            source_id, 
            model_id
        });

        let nonAvailables = await helper.analyseDataAvailability({source_id, conn, name, modelSchema, model: retModel})

        return {nonAvailables};
    }

}


module.exports = dataAnalyseService;
