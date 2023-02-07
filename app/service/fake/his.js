'use strict';

// app/service/user.js
const Service = require('egg').Service;

class HisService extends Service {
    async checkStorage({rowid}) {
        const {ctx: { model }} = this;
        const medicine = await model.ConsultMedicine.findOne({
            hisMedicine: rowid
        })
        return !!medicine;
    }

    async test() {
        const {ctx: { model }} = this;
        let obj = await model.ConsultMedicine.find({
            uniqKey: {$in: ["2:11000116"]}
        })
        return obj;
    }

    async syncMedicine() {
        return medicineList;
    }

    async syncMedicine2() {
        return medicineList2;
    }

    async getGroups() {
        return groups;
    }

    async queryStockByDrugCode({arcCode}){
        return (Math.random() > 0.5 ? 1 : 0);
    }
}

module.exports = HisService;


const medicineList = [
    {
        "branchCode": "2",
        "arcCode": "11000116",
        "arcDesc": "硫酸庆大霉素2",
        "arcAlias": "LSQDMSZSY",
        "arcSpec": "8万单位*10",
        "arcUnitPrice": "24",
        "arcUom": {
            "arcUom": "22",
            "arcUom_Desc": "盒"
        },
        "type": "medicine",
        "arcDosageUom": [
            {
                "arcUom": "1",
                "arcUom_Desc": "万u"
            }
        ]
    },
    {
        "branchCode": "2",
        "arcCode": "11000119",
        "arcDesc": "青霉素",
        "arcAlias": "LSQDMSZSY",
        "arcSpec": "8万单位*10",
        "arcUnitPrice": "18.2",
        "arcUom": {
            "arcUom": "22",
            "arcUom_Desc": "盒"
        },
        "type": "medicine",
        "arcDosageUom": [
            {
                "arcUom": "1",
                "arcUom_Desc": "万u"
            }
        ]
    },
    {
        "branchCode": "2",
        "arcCode": "11000117",
        "arcDesc": "红霉素",
        "arcAlias": "LSQDMSZSY",
        "arcSpec": "8万单位*10",
        "arcUnitPrice": "12.4",
        "arcUom": {
            "arcUom": "22",
            "arcUom_Desc": "盒"
        },
        "type": "medicine",
        "arcDosageUom": [
            {
                "arcUom": "1",
                "arcUom_Desc": "万u"
            }
        ]
    }
]

const medicineList2 = [
    {
        "branchCode": "2",
        "code": "11000116",
        "desc": "青霉素注射液",
        "unitPrice": "23",
        "alias": "LSQDMSZSY",
        "spec": "8万单位*10",
        "uom": {
            "uom": "22",
            "uom_Desc": "盒"
        },
        "type": "medicine",
        "dosageUom": [
            {
                "uom": "1",
                "uom_Desc": "万u"
            }
        ]
    },
    {
        "branchCode": "2",
        "code": "11000119",
        "desc": "红霉素眼膏",
        "unitPrice": "15.6",
        "alias": "LSQDMSZSY",
        "spec": "8万单位*10",
        "uom": {
            "uom": "22",
            "uom_Desc": "盒"
        },
        "type": "medicine",
        "dosageUom": [
            {
                "uom": "1",
                "uom_Desc": "万u"
            }
        ]
    },
    {
        "arcPlaceCode": "2",
        "code": "9000020180710145238",
        "desc": "头孢克肟分散片",
        "unitPrice": "21.2",
        "alias": "TBKWFSP",
        "spec": "0.1g*6片",
        "uom": {
          "uom": "22",
          "uom_Desc": "盒"
        },
        "type": "medicine",
        "dosageUom": [
          {
            "uom": "22",
            "uom_Desc": "盒"
          }
        ]
      }
]


const groups = [
        {
            "deptDutyId":"317",
            "ksdm":"317",
            "ksmc":"血液透析专科"
        },
        {
            "deptDutyId":"232",
            "ksdm":"232",
            "ksmc":"消化内科专科"
        },
        {
            "deptDutyId":"225",
            "ksdm":"225",
            "ksmc":"心血管内科专家"
        },
        {
            "deptDutyId":"369",
            "ksdm":"369",
            "ksmc":"血液肿瘤中心专家"
        }
    ]