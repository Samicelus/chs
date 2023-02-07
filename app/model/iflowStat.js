'use strict';

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'activity_stats');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const IflowStatSchema = new Schema({
        company_id: {                           //医院id, 无该字段则表示全局
            type: String
        },
        time: {
            year: {                             //年数，用于统计
                type: Number
            },
            month: {                            //月数，用于统计 [0, 11]
                type: Number
            },
            week: {                             //周数，用于统计 [1, 52]
                type: Number
            },
            date: {                             //日期数，用于统计 [1, 31]
                type: Number
            },
            day: {                              //星期数，用于统计 [0, 6]
                type: Number
            },
            format: {                           //日期格式 YYYY-MM-DD
                type: String
            }
        },
        count: {                                        //新建流程数
            type: Number,
            default: 0
        }
    }, {versionKey: false});

    return conn.model('iflow_stats', IflowStatSchema);
};
