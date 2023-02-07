'use strict';
const {CONDITION_TYPE_MAP, DOC_MAP, KEYEVAL_ELEMENT_MAP, STATISTIC_METHOD_MAP, STATISTIC_COMPARE_OPERATOR_MAP} = require('../../const/module/consult')

const mongoSwitch = require('../../lib/mongoSwitch/mongoSwitch');

module.exports = app => {

    const conn = mongoSwitch(app, 'statusConfig');

    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;

    const StatusConfigSchema = new Schema({
        app_oid: { type: mongoose.Types.ObjectId },
        name: {                         //状态名称
            type: String,
            required: true
        },
        values: [                       //状态值枚举
            {
                value: {                //状态值
                    type: String
                },
                condition: {            //达成条件
                    conditionType: {
                        type: String,
                        enum: Object.keys(CONDITION_TYPE_MAP),
                        required: true
                    },
                    targetModel: {      //取值数据来源的数据库表名
                        type: String,
                        enum: Object.keys(DOC_MAP),
                        required:false
                    },
                    min: {
                        type: Number,
                        min: 1,
                        required: false
                    },
                    extra: {            //额外筛选条件，配合targetModel使用
                        type: Object,
                        required: false
                    },
                    targetElement:{     //目标数据
                        type: String,
                        enum: Object.keys(KEYEVAL_ELEMENT_MAP),
                        required: false
                    },
                    populate:[{         //取数据来源时的关联查询，配合targetModel使用
                        type: String
                    }],
                    fetch:{             //统计比较时从数据来源取值的方式
                        path: {         //取值路径
                            type: Object
                        },
                        method: {       //统计方法
                            type: String,
                            enum: Object.keys(STATISTIC_METHOD_MAP)
                        },
                        default: {      //未取得值时的默认值，不设则会跳过该值
                            type: Object
                        },
                        fetch: {        //若取值为数据，如何统计数组内的值
                            path: {
                                type: Object
                            },
                            method: {
                                type: String,
                                enum: Object.keys(STATISTIC_METHOD_MAP)
                            },
                            default: {
                                type: Object
                            },
                            fetch: {
                                type: Object
                            }
                        }
                    },
                    compare:{                  //如何比较统计值做判断
                        offset: {              //对统计值的补偿
                            default: {           //默认值
                                type: Number
                            },
                            fromCtx: {           //取值来源,基于ctx
                                type: String
                            },
                            fetch: {            //结构同外层fetch
                                type: Object
                            }
                        },
                        operator: {            //比较逻辑
                            type: String,
                            enum: Object.keys(STATISTIC_COMPARE_OPERATOR_MAP)
                        },
                        value: {               //比较值
                            type: Object
                        },
                        left: {                //左比较值(用于范围)
                            type: Number
                        },
                        right: {               //右比较值(用于范围)
                            type: Number
                        }
                    },
                    elementKey: {
                        type: String,
                        required: false
                    },
                    elementEval: {
                        type: Object,
                        required: false
                    },
                    service: {
                        type: String,
                        required: false
                    }
                },
                isDefault: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        created: {
            type: Date,
            default: Date.now()
        },
        updated: {
            type: Date,
            default: Date.now()
        }
    }, {versionKey: false});

    return conn.model('statusConfig', StatusConfigSchema);
};
