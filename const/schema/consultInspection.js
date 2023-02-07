const mongoose = require('mongoose');

const schema = {
    company_oid: {
        type: mongoose.Types.ObjectId,
        ref: 'company',
        required: true
    },
    uniqKey: {
        type: String,
        unique: true
    },
    type: {
        type: String,
        default: "lab"
    },
    branchCode: {           //his系统中针对不同分院不同药房的code,
                           
        type: String,
        mapName: '检验检查所在药房/院区代码'
    },
    hisInspection: {          //his系统中本检验检查的代码
        type: String,
        required: true,
        mapName: '检验检查his系统代码'
    },
    hisInspectionDesc: {      //his系统中本药品的描述
        type: String,
        required: true
    },
    hisInspectionAlias: {     //his系统中本检验检查简介
        type: String
    },
    hisUnitPrice: {         //单价
        type: Number,
        mapName: '检验检查单价'
    },
    hisUom: {               //计价单位id
        type: String
    },
    hisType: {               //his类型id
        type: String
    },
    hisTypeDesc: {               //his类型描述
        type: String
    },                            //检验检查的详细单项
    item: {
        type:Array,
        default:[]
    }
}

module.exports = schema;