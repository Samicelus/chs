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
        default: "medicine"
    },
    branchCode: {           //his系统中针对不同分院不同药房的code,
                            //开处方接口中可能需要传入
        type: String,
        mapName: '药品所在药房/院区代码'
    },
    hisPlace: {             //his系统里的产地代码
        type: String,
        mapName: '厂商代码'
    },
    hisMedicine: {          //his系统中本药品的代码
        type: String,
        required: true,
        mapName: '药品his系统代码'
    },
    hisMedicineDesc: {      //his系统中本药品的描述
        type: String,
        required: true
    },
    hisMedicineAlias: {     //his系统中本药品别名
        type: String
    },
    hisSpecDesc: {          //his系统中本药品规格的描述
        type: String
    },
    hisUnitPrice: {         //单价
        type: Number,
        mapName: '药品单价'
    },
    hisUom: {               //计价单位id
        type: String
    },
    hisManfDesc: {          //his系统中本药品生产厂商描述
        type: String
    },
    hisForm: {              //剂型id
        type: String,
        mapName: '药品剂型代码'
    },
    hisFormDesc: {          //剂型描述
        type: String
    },
    hisDosageNum: {         //剂量(his中默认推荐剂量)
        type: Number
    },
    hisDosageUom: {         //剂量单位id
        type: String,
        mapName: '剂量单位字典代码'
    },
    hisDuration: {          //疗程单位id
        type: String
    },
    isInsurance: {          //是否包含在医保中
        type: Boolean
    },
    needSkinTest: {         //是否需要皮试
        type: Boolean
    },
    disabled: {             //是否不可用
        type: Boolean
    },
    shouldDoctorPermitInsurance: {          //是否由医生允许包含在医保中？
        type: Boolean
    }
}

module.exports = schema;