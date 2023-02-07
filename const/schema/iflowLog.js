const mongoose = require('mongoose');

const schema = {
    iflow_oid: {                                         //流程id
        type: mongoose.Types.ObjectId,
        ref: 'iflows'
    },
    smartApp_oid: {                                      //应用id
        type: mongoose.Types.ObjectId,
        ref: 'smartapps'
    },
    company_oid: {                                      //医院id
        type: mongoose.Types.ObjectId,
        ref: 'company'
    },
    handler_oid: {                                      //审批人id
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    data: {                                             //审批数据
        type: Object
    },
    currentStep_oid: {                                  //当前步骤id
        type: mongoose.Types.ObjectId,
        ref: 'iflow_steps'
    },
    nextStep_oid:{                                      //最终流转到步骤id
        type: mongoose.Types.ObjectId,
        ref: 'iflow_steps'
    },
    hitRegex: {                                         //命中的判断
        type: String
    },
    whichRpc: {                                         //调用的rpc
        type: String
    },
    handleEvents: {                                     //触发的事件
        type: Array
    },
    decisionNextKey: {                                  //下一步流向的key值
        type: String
    },
    nextStepKey: {                                      //流程实际走向key值
        type: String
    },
    process: [                                          //执行过程
        {
            state: {
                type: String
            },
            time: {
                type: Number
            }
        }
    ],
    flowResult: {
        success: {
            type: Boolean,
            default: true
        },
        read: [{
            type: mongoose.Types.ObjectId,
            ref: 'consultUser'
        }],
        error: {                                    //调用时发生的错误
            type: Object
        }
    },
    totalTime: {
        type: Number
    },
    created: {                                      //审批时间
        type: String
    },
    updated: {                                      //修改时间
        type: String
    }
}

module.exports = schema;