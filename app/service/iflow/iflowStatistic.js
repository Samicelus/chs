'use strict';

const Service = require('egg').Service;
const moment = require('moment');

class IflowStatisticService extends Service {
    async getIflowProcessTime({company_id, begin, end}) {
        const {ctx:{model, helper},logger, app:{mongoose: {Types: {ObjectId}}}} = this;
        
        let condition = {
            company_id,
            created: {
                "$gte": begin,
                "$lt": end
            },
            current_step_type: "end"
        };

        let iflows = await model.Iflow.find(condition).select('created modified').lean();

        let total = 0;
        let count = iflows.length;

        iflows.forEach(item=>{
            total += moment(item.modified).diff(moment(item.created), 'minutes');
        })

        return {avg: total/count}
    }
}

module.exports = IflowStatisticService;
