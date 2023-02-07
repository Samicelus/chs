const mongoose = require('mongoose');
const {SEND_STATE_MAP, DIAGNOSIS_TYPE_MAP} = require('../model/advice');

const schema = {
    consult_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'consult',
        required: true,
        mapName: '咨询单详情'
    },
    hisId: {                    //his系统中处方的id
        type: String,
        mapName: 'his系统中处方Id'
    },
    diagnosisType: {            //医嘱类型: 初步诊断，复诊，术后复诊
        type: String,
        enum: Object.keys(DIAGNOSIS_TYPE_MAP),
        default: "further",
        mapName: '诊断类型'
    },
    diagnosis: {                //诊断
        type: String,
        mapName: '诊断'
    },
    notes: {                    //备注
        type: String,
        mapName: '备注'
    },
    //检验检查
    labs:{
        type:[
            {
                "inspection_oid":{                 //inspection:{}
                    type: mongoose.Types.ObjectId,
                    ref: 'consultInspection',
                    required: true,
                    mapName: '检验检查详情'
                },
                "quantity": {
                    type: Number,
                    mapName: '检验检查数量',
                    default:1
                }
            }
        ],
        mapName: '检验检查列表'
    },
    advices:{
        type:[                   //医嘱: [{"medicine":{"_id":"","medicine_name":""},"quantity":0,"unit":"盒","dosage":"7mg","method":"口服","frequency":"1天3次","notes":""}]
            {
                "medicine_oid": {
                    type: mongoose.Types.ObjectId,
                    ref: 'consultMedicine',
                    required: true,
                    mapName: '药品详情'
                },
                "quantity": {
                    type: Number,
                    mapName: '开药数量'
                },
                "unit": {
                    type: String,
                    mapName: '开药单位字典代码'
                },
                "dosage": {
                    type: Number,
                    mapName: '剂量数值'
                },
                "dosageUnit": {
                    type: String,
                    mapName: '剂量单位字典代码'
                },
                "method": {
                    type: String,
                    mapName: '用法字典代码'
                },
                "duration": {
                    type: String,
                    mapName: '疗程字典代码'
                },
                "frequency": {
                    type: String,
                    mapName: '频次字典代码'
                },
                "notes": {
                    type: String,
                    mapName: '备注'
                },
                "price": {
                    type: Number,
                    mapName: '开药时的药品单价'
                }
            }
        ],
        mapName: '药品列表'
    },
    sentState: {                   //发送状态
        type: String,
        enum: Object.keys(SEND_STATE_MAP),
        default: "wait",
        mapName: '发送状态'
    },
    CA:{                        //CA签名详情
        signId: {               //CA签名id(CA_uniqueId)
            type: String,
            mapName: 'CA签名id'
        },
        signPng: {              //医师签章(CA_png)
            type: String
        },
        signResult: {           //签名值(CA_signResult)
            type: String
        },
        signCert: {             //证书值(Ca_signCert)
            type: String
        },
        isSigned: {                 //签名状态(CA_state)
            type: Boolean,
            default: false,
            mapName: 'CA签名状态'
        }
    },
    isAuthed: {                 //审核状态
        type: Boolean,
        default: false,
        mapName: '审方状态'
    },
    isCanceled: {              //是否已取消
        type: Boolean,
        default: false,
        mapName: '是否已取消'
    },
    cancelReason: {             //取消医嘱的原因
        type: String,
        mapName: '取消原因'
    },
    adviceType: {               //"1"药品医嘱 "2"耗材 "3"检验检查,"11"自助机药品医嘱,"13"自助机检验检查,
        type: String,
        mapName: '医嘱类型'
    },
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    }
}

module.exports = schema;