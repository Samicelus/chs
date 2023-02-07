'use strict';
const _ = require('lodash');
const {Footer, Header, Paragraph, Media, TextRun, Table, TableCell, TableRow, PageNumber} = require('docx');
const mongoose = require('mongoose');
const mysql = require('mysql');
const {MONGO_DATA_TYPES} = require('../../const/module/customizeModel');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const xml2js = require('xml2js');
var parser = new xml2js.Parser({ explicitArray: false });
var builder = new xml2js.Builder({ headless: true, xmldec: { version: "1.0", encoding: "UTF-8" }, renderOpts: { 'pretty': false } });
const cipher_secret = "consultModulation"
let COS = require('cos-nodejs-sdk-v5');
let params = {
    SecretId: 'AKIDLVmwv0BmTyscAWqtnV1CC0hdOxOdhm4P', /* 必须 */
    SecretKey: 'UnusjPuIaieTaWGqHcmka2lJjxzqW1tZ'
};
let cos = new COS(params);
const sm3 = require('../../lib/crypto/sm3');
const JSSM4 = require('jssm4');
const wecom = require('@wecom/crypto');
const { lastIndexOf } = require('../../const/privateCompanies/companies');

module.exports = {
    // 转boolean
    toBoolean(param) {
        if (typeof param === 'boolean') {
            return param
        }
        if (param == 'true' || param == 1) {
            return true
        }
        return false
    },
    validate(options) {
        const { body, query, params } = options;
        if (body) {
            this.ctx.validate(body);
        }
        if (query) {
            this.ctx.validate(query, this.ctx.query);
        }
        if (params) {
            this.ctx.validate(params, this.ctx.params);
        }
    },

    async getAccessToken(company_id, app_id){
        const {ctx:{model}, logger, app:{redis}} = this;

        let key = `${company_id}:${app_id}:access_token`;
        let cached = await redis.get(key);

        if(!cached){
            let company = await model.Company.findById(company_id).lean();
            if(!(company && company.weixinqy && company.weixinqy.corpId)){
                throw new Error('未找到企业或企业未设置corpId');
            }

            let smartapp = await model.SmartApp.findById(app_id).lean();
            if(!(smartapp && smartapp.weixinqy && smartapp.weixinqy.secret)){
                throw new Error('未找到应用或应用未设置secret');
            }
            let url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken";
            let data = {
                corpid: company.weixinqy.corpId,
                corpsecret: smartapp.weixinqy.secret
            };

            let result = (await this.ctx.curl(url,
                {
                    method: 'GET',
                    data,
                    dataType: 'json'
                }
            )).data;

            if(result.errcode){
                throw new Error(result.errmsg)
            }

            cached = result.access_token;
            await redis.set(key, cached, "EX", 7000);
        }

        return cached;
    },

    /**
     * 将validate的标准schema转化成api配置中的returnConfig形式
     *
     * @param {*} validator validate模板
     * @param {*} returnConfig api的return设置模式
     */
    validator2ReturnConfig(validator){
        let config = {};
        recusiveValidator2Return(validator, config);
        return config;
    },

    formXLSX(api) {
        //基础信息
        let basic = {
            "API名称": api.name,
            "URL": api.url,
            "请求方法": api.method
        };
        if(api.method=="SOAP" && api.funcName){
            basic["SOAP方法名称"] = api.funcName;
        }

        //前置请求配置
        let pre = {
            "是否有前置请求": api.pre.hasPre
        }

        let processReturn = []
        if(api.pre.hasPre){
            pre["API名称"] = api.pre.apiName;
            for(let key in api.pre.processReturn){
                let temp = {
                    "前置结果Path": key,
                    "请求header": "",
                    "请求body": "",
                    "请求query": ""
                }
                if(api.pre.processReturn[key].header){
                    temp["请求header"] = api.pre.processReturn[key].header.name;
                }
                if(api.pre.processReturn[key].body){
                    temp["请求body"] = api.pre.processReturn[key].body.name;
                }
                if(api.pre.processReturn[key].query){
                    temp["请求query"] = api.pre.processReturn[key].query.name;
                }
                processReturn.push(temp);
            }
        }

        //缓存配置
        let cache = {
            "是否缓存": api.cache.isCached,
            "立即清除缓存": api.cache.renew,
            "缓存过期时间": 0,
            "缓存字段": api.cache.cacheKey
        };
        if(api.cache.cacheTime){
            cache["缓存过期时间"] = api.cache.cacheTime.default
        }

        //数据来源
        let dataSource = [];
        if(api.dataSource){
            for(let source of api.dataSource){
                dataSource.push({
                    "数据来源名称": source.sourceName,
                    "数据模型名称": source.collectionName,
                    "数据组合引用映射": source.path,
                    "查询语句query": source.query,
                    "mongoose模型名称": source.targetModel
                })
            }
        }

        //数据组合
        let dataMerge = [];
        if(api.dataMerge){
            for(let key in api.dataMerge){
                dataMerge.push({
                    "字段名": key,
                    "来源类型": api.dataMerge[key].from,
                    "引用映射": api.dataMerge[key].source,
                    "引用路径": api.dataMerge[key].path,
                    "脱敏方式": api.dataMerge[key].desensitization,
                    "系统方法": api.dataMerge[key].method
                })
            }
        }

        //返回配置
        let ret = [];
        if(api.return){
            for(let key in api.return){
                ret.push({
                    "字段名": key,
                    "来源类型": api.return[key].from,
                    "引用映射": api.return[key].source,
                    "引用路径": api.return[key].path,
                    "脱敏方式": api.return[key].desensitization,
                    "系统方法": api.return[key].method
                })
            }
        }

        //表格
        let wb = XLSX.utils.book_new();

        //基础信息表
        let basic_sheet = XLSX.utils.json_to_sheet([basic]);
        basic_sheet['!cols'] = [{wpx:100},{wpx:300},{wpx:60}];
        XLSX.utils.book_append_sheet(wb, basic_sheet, '基础信息');

        //前置请求表
        let pre_sheet = XLSX.utils.json_to_sheet([pre]);
        pre_sheet['!cols'] = [{wpx:100},{wpx:100}];
        XLSX.utils.book_append_sheet(wb, pre_sheet, '前置请求配置');

        //前置请求返回设置
        let preReturn_sheet = XLSX.utils.json_to_sheet(processReturn);
        preReturn_sheet['!cols'] = [{wpx:120},{wpx:150},{wpx:150},{wpx:60}];
        XLSX.utils.book_append_sheet(wb, preReturn_sheet, '前置请求返回配置');

        //缓存配置
        let cache_sheet = XLSX.utils.json_to_sheet([cache]);
        cache_sheet['!cols'] = [{wpx:100},{wpx:100},{wpx:100},{wpx:100}];
        XLSX.utils.book_append_sheet(wb, cache_sheet, '缓存配置');

        //数据来源配置
        let source_sheet = XLSX.utils.json_to_sheet(dataSource);
        if(source_sheet){
            source_sheet['!cols'] = [{wpx:100},{wpx:100},{wpx:100},{wpx:100},{wpx:120}];
            XLSX.utils.book_append_sheet(wb, source_sheet, '数据来源配置');
        }

        //数据组合配置
        let merge_sheet = XLSX.utils.json_to_sheet(dataMerge);
        if(merge_sheet){
            merge_sheet['!cols'] = [{wpx:100},{wpx:100},{wpx:100},{wpx:200},{wpx:60},{wpx:60}];
            XLSX.utils.book_append_sheet(wb, merge_sheet, '数据组合配置');
        }

        //返回配置
        let ret_sheet = XLSX.utils.json_to_sheet(ret);
        ret_sheet['!cols'] = [{wpx:100},{wpx:100},{wpx:100},{wpx:200},{wpx:60},{wpx:60}];
        XLSX.utils.book_append_sheet(wb, ret_sheet, '返回配置');

        return XLSX.stream.to_json(wb);
    },

    /**
     * 根据api配置组装markdown格式文档
     * @param {Object} API配置
     */
    formApiMD(apiConfig){
         //标题
         let doc = `## 接口名称:${apiConfig.name}\r`;

         //接口基础信息
         doc += `### URL \r/v1/public/api/call\r### Method \rPOST\r`;
         doc += `### 入参列表 \r|key|类型|说明|\r|:------|:-------|:-------|\r`;
         if(apiConfig.tag_oid && apiConfig.tag_oid.tagName){
            doc += `|company_id|String(24)|固定传入值: "${apiConfig.app_oid.company_oid}"|\r|tagName|String|固定传入值: "${apiConfig.tag_oid.tagName}"|\r`;
        }else{
            doc += `|app_id|String(24)|固定传入值: "${apiConfig.app_oid._id}"|\r|apiName|String|固定传入值: "${apiConfig.name}"|\r`;
        }
        doc +=`|params|Object|调用传参|\r`;

        //从dataSource和data中获取params
        let regex = /\$\{[a-zA-z0-9]*\}/g;
        let dataSource = apiConfig.dataSource;
        for(let source of dataSource){
            if(source.targetModel){
                let targetModel = source.targetModel;
                let paramKey = targetModel.charAt(0).toLowerCase()+targetModel.slice(1)+"_id";
                doc += `|params.${paramKey}|String(24)|${targetModel}表中id|\r`;
            }

            if(source.query){
                let innerParams = fetchParams(source.query, regex);
                for(let innerParam of innerParams){
                    doc += `|params.${innerParam}|Unknown||\r`;
                }
            }
        }
        let data = apiConfig.data;
        if(data){
            let innerParams = fetchParams(JSON.stringify(data), regex);
            for(let innerParam of innerParams){
                doc += `|params.${innerParam}|Unknown||\r`;
            }
        }

        //返回
        doc += `### 出参列表\r|key|类型|说明|\r|:------|:-------|:-------|\r`;
        let returnConfig = apiConfig.return;
        let returnParams = parseReturn(returnConfig);
        for(let returnParam of returnParams){
            doc += `|${returnParam.path}|${returnParam.type}||\r`;
        }

        return doc;
    },

    /**
     * 根据api配置组装docx格式文档
     * @param {Object} apiConfig API配置
     * @param {docx.Document} doc 用于编辑的Document类
     */
    formApiDoc(apiConfig, doc){

        let logo = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../public/images/logo.png')), 50, 30);

        //请求头
        let headertable = [];
        headertable.push(['key', '说明']);
        if(apiConfig.headers){
            for(let key in apiConfig.headers){
                headertable.push([key, `固定值:'${apiConfig.headers[key]}'`]);
            }
        }

        //入参
        let intable = [];
        intable.push(['key','类型','说明']);
        let target = {}

        //入参示例
        let inExample = apiConfig.data?_.cloneDeep(apiConfig.data): {};

        if(apiConfig.data){
            target = flattenJson(apiConfig.data, target);
            for(let rulePath in target){
                intable.push([rulePath, target[rulePath].type, target[rulePath].description]);
            }
        }

        if(apiConfig.dataMerge){
            target = {};
            target = parseMerge(apiConfig.dataMerge, target);
            for(let rulePath in target){
                intable.push([rulePath, target[rulePath].type, target[rulePath].description]);
                mergeObj(inExample, rulePath, target[rulePath].type);
            }
        }

        console.log(inExample);

        let inExampleTexts = [];
        inExampleTexts = JSON.stringify(inExample, null, 4).split('\n').map(
            item => {
                return new Paragraph({
                    children: [
                        new TextRun({
                            text: item,
                            break: 2
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                })
            }
        );


        //来自前置请求
        if(apiConfig.pre && apiConfig.pre.processReturn){
            for(let key in apiConfig.pre.processReturn){
                let item = apiConfig.pre.processReturn[key];
                if(item.query || item.body){
                    //入参
                    intable.push([item.query?item.query.name:item.body.name, 'String', `来自前置请求:${apiConfig.pre.apiName}`]);
                }
                if(item.header){
                    headertable.push([item.header.name, `来自前置请求:${apiConfig.pre.apiName}`]);
                }
            }
        }

        //返回-从return里面找来自接口返回的
        let outtable = [];
        outtable.push(['key','类型','说明']);

        if(apiConfig.return){
            let returnParams = parseReturn(apiConfig.return);
            for(let returnParam in returnParams){
                outtable.push([returnParam, returnParams[returnParam].type, returnParams[returnParam].description]);
            }
        }

        //返回示例
        let outExampleTexts = [];
        if(apiConfig.mock && apiConfig.mock.mockReturn){
            if(apiConfig.mock.dataType == "json"){
                outExampleTexts = JSON.stringify(apiConfig.mock.mockReturn, null, 4).split('\n').map(
                    item => {
                        return new Paragraph({
                            children: [
                                new TextRun({
                                    text: item,
                                    break: 2
                                })
                            ],
                            spacing: {
                                before: 100,
                                after: 50
                            },
                            alignment: 'left'
                        })
                    }
                );
            }else{
                outExampleTexts.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: apiConfig.mock.mockReturn,
                            break: 2
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left'
                }))
            }
        }


        let hostRoute = [];
        if(apiConfig.host){
            hostRoute.push(apiConfig.host);
        }
        if(apiConfig.url){
            hostRoute.push(apiConfig.url);
        }

        let url = (apiConfig.protocal||"") + hostRoute.join('/');

        let docName = "";
        if(apiConfig.app_oid){
            docName = apiConfig.app_oid.name
        }else if(apiConfig.apiTemplate_oid){
            docName = apiConfig.apiTemplate_oid.templateName
        }


        doc.addSection({
            properties: {},
            headers:{
                default: new Header({
                    children: [new Paragraph(
                        {
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text:`${docName} 接口文档`,
                                })
                            ]
                        }
                    )]
                }),
                children:[]
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                logo,
                                new TextRun({
                                    children:[
                                        'CURRENT',
                                        '/',
                                        'TOTAL_PAGES'
                                    ]
                                }).break()
                            ],
                            indent:{
                                left: 200,
                                right: 200
                            }
                        }),
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text: '义幻医疗内部资料, 禁止公开。',
                                    size: 20,
                                    color: "888888",
                                    italics: true
                                })
                            ]
                        })
                    ]
                }),
                children:[]
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `接口名称:${apiConfig.name}`,
                            bold: true
                        })
                    ],
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            value: "double",
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            value: "double",
                            size: 6,
                        }
                    },
                    spacing: {
                        after: 200
                    },
                    heading: 'Heading1'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `URL`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: url,
                            bold: true
                        })
                    ],
                    alignment: 'left'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Method`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${apiConfig.method}${apiConfig.funcName?'-'+apiConfig.funcName:''}`,
                            bold: true
                        })
                    ],
                    alignment: 'left'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `请求头设置`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Table({
                    rows: headertable.map((rowContent, index)=>{
                        return new TableRow({
                            children: rowContent.map(item=>{
                                return new TableCell({
                                    children:[
                                        new Paragraph({
                                            children:[
                                                new TextRun({
                                                    text: item,
                                                    bold: (index === 0)?true:false
                                                })
                                            ],
                                            indent:{
                                                left: 200,
                                                right: 200
                                            }
                                        })
                                    ],
                                    shading: {
                                        fill: (index === 0)?'24A1AC':'DDDDDD',
                                        color: (index === 0)?'FFFFFF':'000000'
                                    },
                                    margins:{
                                        top: 100,
                                        bottom: 100
                                    }
                                })
                            })
                        })
                    })
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `入参列表`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Table({
                    rows: intable.map((rowContent, index)=>{
                        return new TableRow({
                            children: rowContent.map(item=>{
                                return new TableCell({
                                    children:[
                                        new Paragraph({
                                            children:[
                                                new TextRun({
                                                    text: item,
                                                    bold: (index === 0)?true:false
                                                })
                                            ],
                                            indent:{
                                                left: 200,
                                                right: 200
                                            }
                                        })
                                    ],
                                    shading: {
                                        fill: (index === 0)?'24A1AC':'DDDDDD',
                                        color: (index === 0)?'FFFFFF':'000000'
                                    },
                                    margins:{
                                        top: 100,
                                        bottom: 100
                                    }
                                })
                            })
                        })
                    })
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `入参示例`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                ...inExampleTexts,
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `返回数据格式`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${apiConfig.convertText} ${apiConfig.dataType}`,
                            bold: true
                        })
                    ],
                    alignment: 'left'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `返回列表`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Table({
                    rows: outtable.map((rowContent, index)=>{
                        return new TableRow({
                            children: rowContent.map(item=>{
                                return new TableCell({
                                    children:[
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: item,
                                                    bold: (index === 0)?true:false
                                                })
                                            ],
                                            indent:{
                                                left: 200,
                                                right: 200
                                            }
                                        })
                                    ],
                                    shading: {
                                        fill: (index === 0)?'24A1AC':'DDDDDD',
                                        color: (index === 0)?'FFFFFF':'000000'
                                    },
                                    margins:{
                                        top: 100,
                                        bottom: 100
                                    }
                                })
                            })
                        })
                    })
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `返回示例`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                ...outExampleTexts,
            ]
        });
    },

    /**
     *
     * @param {Object} groupItem 接口标准成员配置
     * @param {docx.Document} doc 用于编辑的Document类
     */
    formStandardDoc(groupItem, doc){

        let logo = Media.addImage(doc, fs.readFileSync(path.join(__dirname,'../public/images/logo.png')), 50, 30);

        //接口基础信息
        let intable = [];
        intable.push(['key','类型','是否必须','说明']);
        if(groupItem.tag_oid && groupItem.tag_oid.tagName){
            intable.push(['company_id','String(24)','是',`医院id`]);
            intable.push(['tagName','String(24)','是',`固定传入值:"${groupItem.tag_oid.tagName}"`]);
        }

        intable.push(['params','Object','是','调用传参']);

        if(groupItem.params){
            let target = flattenRule(groupItem.params);
            for(let rulePath in target){
                intable.push([`params.${rulePath}`, target[rulePath].type, target[rulePath].required?'是':'否', target[rulePath].description]);
            }
        }

        //返回
        let outtable = [];
        outtable.push(['key','类型','是否必须','说明']);

        if(groupItem.return){
            let target = flattenRule(groupItem.return);
            for(let rulePath in target){
                outtable.push([`${rulePath}`, target[rulePath].type, target[rulePath].required?'是':'否', target[rulePath].description]);
            }
        }

        doc.addSection({
            properties: {},
            headers:{
                default: new Header({
                    children: [new Paragraph(
                        {
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text:`${groupItem.apiGroup_oid.groupName} 接口文档`,
                                })
                            ]
                        }
                    )]
                }),
                children:[]
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                logo,
                                new TextRun({
                                    children:[
                                        'CURRENT',
                                        '/',
                                        'TOTAL_PAGES'
                                    ]
                                }).break()
                            ],
                            indent:{
                                left: 200,
                                right: 200
                            }
                        }),
                        new Paragraph({
                            alignment: 'center',
                            children: [
                                new TextRun({
                                    text: '义幻医疗内部资料, 禁止公开。',
                                    size: 20,
                                    color: "888888",
                                    italics: true
                                })
                            ]
                        })
                    ]
                }),
                children:[]
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `标准名称:${groupItem.itemName}`,
                            bold: true
                        })
                    ],
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            value: "double",
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            value: "double",
                            size: 6,
                        }
                    },
                    spacing: {
                        after: 200
                    },
                    heading: 'Heading1'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `URL`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `/v1/public/api/call`,
                            bold: true
                        })
                    ],
                    alignment: 'left'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Method`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `POST`,
                            bold: true
                        })
                    ],
                    alignment: 'left'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Header`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `传入名为"b-json-web-token"的请求头，对应值为登录接口返回的token`,
                            bold: true
                        })
                    ],
                    alignment: 'left'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `入参列表`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `入参作为请求body传入，格式为raw JSON字符串格式。对应的Content-Type为"application/json"`,
                            bold: false,
                            color: "#CC3366"
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left'
                }),
                new Table({
                    rows: intable.map((rowContent, index)=>{
                        return new TableRow({
                            children: rowContent.map(item=>{
                                return new TableCell({
                                    children:[
                                        new Paragraph({
                                            children:[
                                                new TextRun({
                                                    text: item,
                                                    bold: (index === 0)?true:false
                                                })
                                            ],
                                            indent:{
                                                left: 200,
                                                right: 200
                                            }
                                        })
                                    ],
                                    shading: {
                                        fill: (index === 0)?'24A1AC':'DDDDDD',
                                        color: (index === 0)?'FFFFFF':'000000'
                                    },
                                    margins:{
                                        top: 100,
                                        bottom: 100
                                    }
                                })
                            })
                        })
                    })
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `返回列表`,
                            bold: true,
                            underline: {
                                type: 'single'
                            }
                        })
                    ],
                    spacing: {
                        before: 100,
                        after: 50
                    },
                    alignment: 'left',
                    heading: 'Heading2'
                }),
                new Table({
                    rows: outtable.map((rowContent, index)=>{
                        return new TableRow({
                            children: rowContent.map(item=>{
                                return new TableCell({
                                    children:[
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: item,
                                                    bold: (index === 0)?true:false
                                                })
                                            ],
                                            indent:{
                                                left: 200,
                                                right: 200
                                            }
                                        })
                                    ],
                                    shading: {
                                        fill: (index === 0)?'24A1AC':'DDDDDD',
                                        color: (index === 0)?'FFFFFF':'000000'
                                    },
                                    margins:{
                                        top: 100,
                                        bottom: 100
                                    }
                                })
                            })
                        })
                    })
                })
            ]
        });

    },

    /**
     * 获取所有数据库表
     * @param {String} app_id
     * @param {String} sourceName
     */
    async showTable(param) {
        const {ctx, logger} = this;
        // this 就是 ctx 对象，在其中可以调用 ctx 上的其他方法，或访问属性
        const dataSource = await ctx.model.DataSource.findOne({
            app_oid: mongoose.Types.ObjectId(param.app_id),
            sourceName: param.sourceName
        }).lean();

        const {dbType, connectStr, dbName, login, password} = dataSource;

        const url = formUrl({dbType, connectStr, dbName, login, password});

        let conn;
        let tables;
        switch(dbType){
            case 'mongodb':
                conn = await mongoose.createConnection(url, {useNewUrlParser: true});
                tables = (await conn.db.collections()).map(collection=>{
                    return collection.collectionName;
                });
                break;
            case 'mysql':
                tables = await new Promise((resolve, reject)=>{
                    conn = mysql.createConnection(url);
                    conn.connect(function(err){
                        if(err){
                            reject(err);
                        }else{
                            conn.query(`show tables`, function(error, results){
                                if(error){
                                    reject(error);
                                }else{
                                    resolve(results.map((tableDesc)=>{
                                        return tableDesc[`Tables_in_${dbName}`];
                                    }));
                                }
                            })
                        }
                    });
                })
                break;
            default:
                break;
        }

        return {dbType, tables}
    },

    /**
     *
     * @param {String} app_id
     * @param {String} sourceName
     * @param {String} collectionName
     */
    async showModel(param) {
        const {ctx, logger} = this;
        // this 就是 ctx 对象，在其中可以调用 ctx 上的其他方法，或访问属性
        const dataSource = await ctx.model.DataSource.findOne({
            app_oid: mongoose.Types.ObjectId(param.app_id),
            sourceName: param.sourceName
        }).lean();

        const {dbType, connectStr, dbName, login, password} = dataSource;

        const url = formUrl({dbType, connectStr, dbName, login, password});

        let conn;
        let structure;
        switch(dbType){
            case 'mongodb':
                conn = await mongoose.createConnection(url, {useNewUrlParser: true});
                let collection = await conn.db.collection(param.collectionName);
                structure = await new Promise((resolve, reject)=>{
                    collection.findOne({},function(err, result){
                        if(err){
                            reject(err);
                        }else{
                            resolve(parseMongodbStructure(result, logger));
                        }
                    });
                })
                break;
            case 'mysql':
                structure = await new Promise((resolve, reject)=>{
                    conn = mysql.createConnection(url);
                    conn.connect(function(err){
                        if(err){
                            reject(err);
                        }else{
                            conn.query(`desc ${param.collectionName}`, function(error, results){
                                if(error){
                                    reject(error);
                                }else{
                                    resolve(parseMysqlStructure(results));
                                }
                            })
                        }
                    });
                })
                break;
            default:
                break;
        }

        return {dbType, structure, source_id: dataSource._id}
    },

    /**
     *
     * @param {String} app_id
     * @param {String} sourceName
     * @param {String} collectionName
     * @param {String} source_id
     * @param {String} model_id
     * @param {Array} joins
     */
    async customizeModel({app_id, sourceName, collectionName, source_id, model_id, joins}) {
        const {ctx, app:{_}} = this;
        // this 就是 ctx 对象，在其中可以调用 ctx 上的其他方法，或访问属性
        let dataSource;
        if(app_id && sourceName){
            dataSource = await ctx.model.DataSource.findOne({
                app_oid: mongoose.Types.ObjectId(app_id),
                sourceName
            }).lean();
        }
        if(source_id){
            dataSource = await ctx.model.DataSource.findById(source_id).lean();
        }


        const {dbType, connectStr, dbName, login, password} = dataSource;

        const url = formUrl({dbType, connectStr, dbName, login, password});

        let conn;
        switch(dbType){
            case 'mongodb':
                conn = await mongoose.createConnection(url, {useNewUrlParser: true});
                break;
            case 'mysql':
                conn = await new Promise((resolve, reject)=>{
                    conn = mysql.createConnection(url);
                    conn.connect(function(err){
                        if(err){
                            reject(err);
                        }else{
                            resolve(conn);
                        }
                    })
                })
                break;
            default:
                break;
        }

        let customizedModel;
        if(dataSource && collectionName){
            customizedModel = await ctx.model.CustomizedModel.findOne({
                source_oid: dataSource._id,
                name: collectionName
            }).lean();
        }
        if(model_id){
            customizedModel = await ctx.model.CustomizedModel.findById(model_id).lean();
        }

        let populations = [];

        if(dbType == "mongodb" && Array.isArray(joins) && joins.length>0){
            //若是mongodb的population,则获取schema定义中的ref并进行schema初始化
            let populateModels = joins.map(item=>_.get(formSchema({
                dbType,
                schema:customizedModel.modelSchema
            }), item.joinKey+'.ref'));

            populations = await ctx.model.CustomizedModel.find({
                source_oid: dataSource._id,
                name: {
                    "$in": populateModels
                }
            }).lean();
        }

        let retModel;
        switch(dbType){
            case 'mongodb':
                let schemaObj = formSchema({dbType, schema:customizedModel.modelSchema});
                let schemaInstance = new mongoose.Schema(schemaObj, {collection: customizedModel.name});
                retModel = conn.model(customizedModel.name, schemaInstance);
                populations = populations.map(item=>{
                    if(collectionName != item.name){
                        return conn.model(item.name, schemaInstance);
                    }else{
                        return null;
                    }
                }).filter(item=>!!item);
                break;
            case 'mysql':
                retModel = formSchema({dbType, schema:customizedModel.modelSchema});
                break;
            default:
                break;
        }

        return {retModel, dbType, conn, populations, name: customizedModel.name, modelSchema:customizedModel.modelSchema};
    },

    async analyseDataAvailability({source_id, conn, name, modelSchema, model}){
        //获取schema中所有required字段
        let requireds = getRequiredKeys(modelSchema);
        let nACondition = {"$or":[]};
        for(let item of requireds){
            let arrIndex = item.lastIndexOf('.0.');
            if(arrIndex != -1){
                let subC = {};
                subC[item.substr(0, arrIndex)] = {
                    "$exists": true,
                    "$ne": []
                }
                subC[item] = {
                    "$exists": false
                }
                nACondition["$or"].push(subC);
            }else{
                let subC = {};
                subC[item] = {
                    "$exists": false
                }
                nACondition["$or"].push(subC);
            }
        }

        let nonAvailables = []
        if(Array.isArray(nACondition["$or"]) && nACondition["$or"].length>0){
            nonAvailables = await model.find(nACondition).lean();
        }

        let fCondition = {"$or":[]};
        for(let key in modelSchema){
            let subC = {};
            subC[key] = {
                "$exists": false
            }
            fCondition["$or"].push(subC)
        }
        let fragiles = []
        if(Array.isArray(fCondition["$or"]) && fCondition["$or"].length>0){
            fragiles = await model.find(fCondition).lean();
        }

        let refs = getRefKeys(modelSchema);

        //若是mongodb的population,则获取schema定义中的ref并进行schema初始化
        let populations = [];

        if(Array.isArray(refs) && refs.length>0){
            let populateModels = refs.map(ref=>ref.ref);
            populations = await this.ctx.model.CustomizedModel.find({
                source_oid: this.app.mongoose.Types.ObjectId(source_id),
                name: {
                    "$in": populateModels
                }
            }).lean();
        }
        populations = populations.map(item=>{
            if(name != item.name){
                return conn.model(item.name, formSchema({dbType: 'mongodb', schema:item.modelSchema}))
            }else{
                return null
            }
        }).filter(item=>!!item);

        let instance = model.find({});

        for(let ref of refs){
            instance.populate(ref.path.replace(new RegExp('.0','g'),''));
        }

        let wholePopulated = await instance.lean();

        let nonMatcheds = wholePopulated.filter(function(item){
            for(let ref of refs){
                //populate出的是数组的情况,暂时不作为缺陷数据处理 //TODO: 需要验证数组中每一个元素都不为null
                if(new RegExp('.0','g').test(ref.path)){
                    let arrayPath = ref.path.substr(0, ref.path.lastIndexOf('.0'))
                    let populatePath = ref.path.substr(ref.path.lastIndexOf('.0')+3)
                    //获取populate的数组
                    let arr = _.get(item, arrayPath);
                    if(!Array.isArray(arr)){
                        return true;
                    }
                    let allpops = arr.map(pop=>{
                        return populatePath?_.get(pop, populatePath): pop
                    })
                    if(allpops.includes(null)){
                        return true;
                    }
                }else if(!_.get(item, ref.path)){
                    return true;
                }
            }
            return false;
        })


        return {nonAvailables, fragiles, nonMatcheds};
    },

    desensitization(str, type){
        if(["string","number"].includes(typeof str)){
            str = str.toString()
            switch(type){
                case "phone":
                    return str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
                case "idCard":
                    return str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
                case "passport":
                    return str.slice(0,2)+str.slice(2,-3).replace(/./g,"*")+str.slice(-3);
                case "whole":
                    return str.replace(/./g, '*');
                default:
                    return str;
            }
        }else{
            return str
        }
    },

    async checkDependencies(app_id, moduleKey, actionKey, consult_id){
        const {ctx: { model }, app: { _, mongoose: {Types: { ObjectId }}}} = this;
        console.log(`*****************************************`);
        console.log(`check dependency:`)
        console.log(app_id, moduleKey, actionKey, consult_id)
        let checked = true;
        let failStrArr = [];
        if(!app_id){
            throw new Error(`no app-id is present!`);
        }
        if(!consult_id){
            throw new Error(`no consult-id is present!`);
        }
        let actionObj = await model.ModuleConfig.findOne({
            app_oid: ObjectId(app_id),
            key: moduleKey
        }).select(`actions.${actionKey}.dependencies`).lean();
        let dependencies = actionObj.actions[`${actionKey}`].dependencies;
        if(!actionObj){
            throw new Error(`Invalide app_id: ${app_id}`);
        }
        let status = await model.StatusConfig.find({
            app_oid: ObjectId(app_id),
            name: {"$in":dependencies.map(item => item.statusName)}
        }).select(`name values`).lean();
        status.forEach(state=>{
            state.valueMap = _.keyBy(state.values, function(o){
                return o.value;
            })
        });
        let statusMap = _.keyBy(status, function(o){
            return o.name;
        });
        for(let index in dependencies){
            let dependency = dependencies[index];
            if(consult_id && !await checkDependency(
                await this.translateConfig(app_id, statusMap[dependency.statusName].valueMap[dependency.value]),
                this,
                app_id,
                consult_id
                )){
                checked = false;
                failStrArr.push(dependency.failStr);
            }
        }
        return {
            checked,
            failStrArr
        }
    },

    parseSocketMsg(action, payload = {}, metadata = {}) {
        const meta = Object.assign({}, {
            timestamp: Date.now(),
        }, metadata);

        return {
            meta,
            data: {
                action,
                payload,
            },
        };
    },

    comparePassword(password, hashedPassword){
        let hash = getHash(hashedPassword);
        let salt = getSalt(hashedPassword);
        let hashed = getHash(computeHash(password, salt));
        return hash == hashed;
    },

    generateJWT(payload){
        return jwt.sign(payload, cipher_secret, {expiresIn: '1d'})
    },

    verifyJWT(token){
        try{
            const result = jwt.verify(token, cipher_secret);
            return {
                result: true,
                decoded: result
            }
        }catch(e){
            return {
                result: false,
                message: e.message
            }
        }
    },

    generate16salt(user_id){
        const nowTimestamp = new Date().getTime();
        return crypto.createHash('md5').update(user_id+nowTimestamp).digest('hex').slice(0, 16);
    },

    computeHash(password, salt) {
        return `|SHA|${salt}|${sha256(sha256(password) + salt)}`;
    },

    buildXml({data}){
        return builder.buildObject(data);
    },

    async parseXml({str}){
        return await parser.parseStringPromise(str);
    },

    fetchData({docs, fetch}){
        return fetchData({docs, fetch})
    },

    async translateConfig(app_id, config){
        const {ctx: { model }, app: { _, mongoose: {Types: { ObjectId }}}} = this;
        const customizeConfig = await model.ConsultCustomizeConfig.findOne({
            app_oid: ObjectId(app_id)
        }).lean();
        let configStr = JSON.stringify(config);
        if(customizeConfig){
            for(let key in customizeConfig.config){
                let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
                let replaced = customizeConfig.config[key].value || customizeConfig.config[key].default;
                configStr = configStr.replace(tempRegex, replaced);
            }
        }
        return JSON.parse(configStr);
    },

    sortByAscii(obj, signNull, sortType="keysort") {
        let param_keys = Object.keys(obj);

        //递归比较单词字母顺序
        function compare(w0, w1, i) {
            if (w0.charCodeAt(i) === w1.charCodeAt(i)) {
                return compare(w0, w1, ++i);
            } else if (isNaN(w0.charCodeAt(i)) && !isNaN(w1.charCodeAt(i))) {
                return 0 - w1.charCodeAt(i);
            } else if (!isNaN(w0.charCodeAt(i)) && isNaN(w1.charCodeAt(i))) {
                return w0.charCodeAt(i) - 0;
            } else {
                return w0.charCodeAt(i) - w1.charCodeAt(i);
            }
        }

        //排序后的键
        let new_param_keys = param_keys.sort(function (a, b) {
            let first,last;
            switch(sortType){
                case "keysort":
                    first = a;
                    last = b;
                    break;
                case "valuesort":
                    first = obj[a];
                    last = obj[b]
                    break;
                default:
                    break;
            }
            return compare(first, last, 0);
        });
        let new_obj = {};
        for (let i in new_param_keys) {
            for (let j in obj) {
                if ((obj[j] != null && obj[j] !== '' && new_param_keys[i] == j) || (signNull && (obj[j] == null || obj[j] === ''))) {   //参数的值为空不参与签名,如果signNull为true则参与
                    new_obj[j] = obj[j];
                }
            }
        }
        return new_obj;
    },
    sm3(str){
        console.log(`about to sm3: ${str}`)
        return sm3(str);
    },
    md5(str, encode) {
        return crypto.createHash('md5').update(str, 'utf8').digest(encode);
    },
    sha1(str, encode) {
        let sum = crypto.createHash('sha1');
        sum.update(str, 'utf8');
        str = sum.digest(encode);
        return str;
    },
    sha256(str, encode) {
        let sum = crypto.createHash('sha256');
        sum.update(str, 'utf8');
        str = sum.digest(encode);
        return str;
    },
    hmac(str, encode, secret) {
        console.log(`got secret: ${secret}`)
        return crypto.createHmac('sha256', secret).update(str).digest(encode);
    },
    rsa(str, encode, secret) {
        let sign;
        sign = crypto.createSign('RSA-SHA1');
        sign.update(str);
        return sign.sign(secret, encode);
    },
    rsa2(str, encode, secret) {
        let sign;
        sign = crypto.createSign('RSA-SHA256');
        sign.update(str);
        return sign.sign(secret, encode);
    },

    encrypt(str, algorithm, secret, coding, id=""){
        if(['wecom'].includes(algorithm)){
            return wecom.encrypt(secret, str, id);
        }else if(['sm4'].includes(algorithm)){
            //特殊算法
            switch(algorithm){
                case 'sm4':
                    let sm4 = new JSSM4(secret);
                    return sm4.encryptData_ECB(str);
                default:
                    return str;
            }
        }else if(['RSA-SHA1', 'RSA-SHA256'].includes(algorithm)){
            //node.js crypto原生支持非对称签名算法
            let sign;
            sign = crypto.createSign(algorithm);
            sign.update(str);
            return sign.sign(secret, coding);
        }else{
            //node.js crypto原生支持对称加密算法
            let config = algorithm.split('-')
            let iv;
            switch(config[2]){
                case 'ecb':
                    iv = null;
                    break;
                default:
                    iv = Buffer.alloc(16, 0);
                    break;
            }
            if(secret.length != config[1]/8){
                secret = crypto.scryptSync(secret, '', config[1]/8);
            }
            const cipher = crypto.createCipheriv(algorithm, secret, iv);
            let encrypted = cipher.update(str, 'utf8', coding);
            encrypted += cipher.final(coding);
            return encrypted;
        }
    },

    decrypt(str, algorithm, secret, coding, content=""){
        if(['wecom'].includes(algorithm)){
            return (wecom.decrypt(secret, str)).message;
        }else if(['sm4'].includes(algorithm)){
            //特殊算法
            switch(algorithm){
                case 'sm4':
                    let sm4 = new JSSM4(secret);
                    return sm4.decryptData_ECB(str);
                default:
                    return str;
            }
        }else if(['RSA-SHA1','RSA-SHA256'].includes(algorithm)){
            //node.js crypto原生支持非对称验签算法 (注:返回值为Boolean)
            let verify;
            verify = crypto.createVerify(algorithm);
            verify.update(content)
            return verify.verify(secret, str, coding)
        }else{
            //node.js crypto原生支持对称加密算法
            let config = algorithm.split('-')
            let iv;
            switch(config[2]){
                case 'ecb':
                    iv = null;
                    break;
                default:
                    iv = Buffer.alloc(16, 0);
                    break;
            }
            if(secret.length != config[1]/8){
                secret = crypto.scryptSync(secret, '', config[1]/8);
            }
            const decipher = crypto.createDecipheriv(algorithm, secret, iv);
            let decrypted = decipher.update(str, coding, 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
    },


    /**
     * 记录api调用日志
     * @param {*} param0
     */
    async recordApiLog({}){
        const {ctx: { model }, app: { _, mongoose: {Types: { ObjectId }}}} = this;

    },

    /**
     * 上传文件到cos
     * @param {String} path 本地文件路径
     * @param {String} name 存储文件名
     */
    uploadFile(path, name){
        fs.readFile(path,(err, data)=>{
            if (err) throw err;
            //console.log(data);
            let options = {
                Bucket : 'consult-1253714281', /* 必须 */
                Region : 'ap-guangzhou', /* 必须 */
                Key : name, /* 必须 */
                contentLength: data.length,
                Body: data
            };
            cos.putObject(options, function(err, data) {
                if(err) {
                    throw err;
                } else {
                    fs.unlink(path);
                }
            });
        })
    },

    /**
     * 存储文件数据到cos
     * @param {Buffer} data 存储文件数据
     * @param {String} name 存储文件名
     */
    saveFile(data, name){
        const {logger} = this;
        let options = {
            Bucket : 'consult-1253714281', /* 必须 */
            Region : 'ap-guangzhou', /* 必须 */
            Key : name, /* 必须 */
            StorageClass: 'STANDARD',
            Body: data
        };
        cos.putObject(options, function(err, data) {
            logger.info(err||data);
        });
    },

    /**
     * 从cos上获取文件
     * @param {String} file_name 文件名
     */
    getFile(file_name) {
        let options = {
            Bucket : 'consult-1253714281', /* 必须 */
            Region : 'ap-guangzhou', /* 必须 */
            Key : file_name
        };
        cos.getObject(options, function(err, data) {
            if(err) {
                throw err;
            } else {
                return data.Body;
            }
        });
    },

    flattenPath(obj){
        return flattenPath(JSON.parse(JSON.stringify(obj)))
    },

    /**
     * 按照安全标准(至少8位，必须包含大，小写字母，特殊符号，数字中的至少3种)
     * 生成初始密码或重置的密码
     */
    generatePassword() {
        let lower = "abcdefghijklmnopqrstuvwxyz";
        let upper = "ABCDEFGHIOJKLMNOPQRSTUVWXYZ";
        let num = "0123456789";
        let spec = "!@#$%^&*()-=_+[]{};:./><?,~";
        let all = lower + upper + num + spec;

        let password = lower[Math.floor(Math.random()*lower.length)]
        + upper[Math.floor(Math.random()*upper.length)]
        + num[Math.floor(Math.random()*num.length)]
        + spec[Math.floor(Math.random()*spec.length)]

        for(let i=0;i<4;i++){
            password += all[Math.floor(Math.random()*all.length)];
        }

        return password;
    },

    /**
     * 按照安全标准(至少8位，必须包含大，小写字母，特殊符号，数字中的至少3种)
     * 检查密码
     */
    checkPasswordSecurity(password){
        let lower = /(?=.*[a-z])/;
        let upper = /(?=.*[A-Z])/;
        let num = /(?=.*\d)/;
        let spec = /(?=.*[^A-Za-z0-9\s])/;
        let eight = /(?=^.{8,255}$)/;

        let hasLower = lower.test(password);
        let hasUpper = upper.test(password);
        let hasNum = num.test(password);
        let hasSpec = spec.test(password);
        let atLeast8 = eight.test(password);
        let has3Diff = (hasLower && hasUpper && hasNum) || (hasUpper && hasNum && hasSpec) || (hasLower && hasNum && hasSpec) || (hasLower && hasUpper && hasSpec);

        return {hasLower, hasUpper, hasNum, hasSpec, atLeast8, has3Diff}
    },

    // 暴露生成schema的方法
    formSchema: formSchema,

    // 判断是否是空对象
    isEmptyObj(obj) {
        for (let i in obj) {
            return false;
        }
        return true;
    },
};



function computeHash(password, salt) {
    return `|SHA|${salt}|${sha256(sha256(password) + salt)}`;
};

function getHash(hashedPassword){
    return hashedPassword.split("|")[3];
};

function getSalt(hashedPassword){
    return hashedPassword.split("|")[2];
};

function sha256(str){
    return  crypto.createHash('sha256').update(str).digest('hex');
}

/**
 *
 * @param {Object} state    需要验证的依赖状态
 * "condition.conditionType"
 *  "hasDoc" 存在关联该问诊单的数据
 *  "keyEval" 某数据的某个key为指定值
 *  "hasKey" 某数据的某个key存在或不为false或空
 *  "apiValidate" 从某个已定义好的api获取查询结果
 * @param {Object} that  Egg.js中的this
 * @param {String} consult_id  请求对应的咨询单id
 */
async function checkDependency(state, that, app_id, consult_id){
    const {ctx: { method, model, service:{api}}, app: { _, mongoose: {Types: { ObjectId }}}} = that;
    let checkResult = false;
    let consultObj = await model.Consult.findById(consult_id).populate({
        path: `doctor_oid`
    }).populate({
        path: `patient_oid`
    }).populate({
        path: `record_oid`
    }).lean();
    let element = {};
    switch(state.condition.targetElement){
        case "consult":
            element = consultObj;
            break;
        case "consultDoctor":
            element = consultObj.doctor_oid;
            break;
        case "consultPatient":
            element = consultObj.patient_oid;
            break;
        case "consultRecord":
            element = consultObj.record_oid;
            break;
        default:
            break;
    }
    let condition = {
        consult_oid: ObjectId(consult_id)
    }
    if(state.condition.extra){
        condition = _.merge(condition, state.condition.extra);
    }
    switch(state.condition.conditionType){
        case "hasDoc":
            let count = await model[state.condition.targetModel].count(condition);
            if(count >= Number(state.condition.min)){
                checkResult = true;
            }
            break;
        case "keyEval":
            if(_.get(element, state.condition.elementKey) == state.condition.elementEval){
                checkResult = true;
            }
            break;
        case "hasKey":
            if(_.get(element, state.condition.elementKey)){
                checkResult = true;
            }
            break;
        case "statistic":
            let modelInstance = model[state.condition.targetModel].find(condition)
            if(state.condition.populate &&
                Array.isArray(state.condition.populate)){
                for(let linkedPopolate of state.condition.populate){
                    let populateOption = {};
                    let current = populateOption;
                    let parent;
                    linkedPopolate.split(" ").forEach(item => {
                        current.path = item;
                        current.populate = {};
                        parent = current;
                        current = current.populate;
                    })
                    if(parent){
                        delete parent.populate;
                    }
                    modelInstance.populate(populateOption);
                }
            }
            let docs = await modelInstance.lean();

            if(state.condition.compare.offset){
                state.condition.compare.offset.default = getOffset(state.condition.compare.offset, that.ctx);
            }

            if(compareStatistic({
                method: state.condition.method,
                docs,
                fetch: state.condition.fetch,
                compare: state.condition.compare
            })){
                checkResult = true;
            }
            break;
        case "apiValidate":
            let params;
            switch(method){
                case "GET":
                    params = that.ctx.query;
                    break;
                case "POST":
                    params = that.ctx.request.body;
                    break;
                case "PATCH":
                    params = that.ctx.params;
                    break;
                case "DELETE":
                    params = that.ctx.params;
                    break;
                default:
                    break;
            }
            let result = await api.callConfigedApi({
                app_id,
                apiName: state.condition.service,
                params,
            });
            checkResult = result.result;
            break;
        default:
            break;
    }
    return checkResult;
}


/**
 * 计算纯数字输入的统计结果
 * @param {String} method 统计方法名
 * @param {Array} datas 数据来源
 */
function getStatisticResult({method, datas}){
    let sum,average,diffSum;
    switch(method){
        //数字和
        case 'SUM':
            return _.sum(datas);
        //平均值
        case 'AVERAGE':
            sum = _.sum(datas);
            return _.divide(sum, datas.length);
        //最大值
        case 'MAX':
            return _.max(datas);
        //最小值
        case 'MIN':
            return _.min(datas);
        //离散度
        case 'AVEDEV':
            sum = _.sum(datas);
            average = _.divide(sum, datas.length);
            diffSum = _.sum(datas.map(num=>{
                return Math.abs(num-average)
            }));
            return _.divide(diffSum, datas.length);
        case 'WEIGHTEDSUM':
            return _.sum(_.map(datas,inner=>_.reduce(inner,(result,value)=>{
                return result*value;
            },1)))
        default:
            return;
    }
}

/**
 * 与统计结果(补偿后)比较得出是否满足条件的判断
 * @param {Array} docs 数据来源自数据库
 * @param {Object} fetch 详见fetchData方法
 * @param {Object} compare {offset:对统计值的补偿, operator:比较方法, value:比较基准值, left:范围比较时的左值, right:范围比较时的右值}
 * @return {Boolean}
 */
function compareStatistic({docs, fetch, compare}){

    let statisticResult = fetchData({docs, fetch})

    console.log(`statisticResult: ${statisticResult}`);

    if(compare.offset && compare.offset.default){
        statisticResult += compare.offset.default
    }

    console.log(`offsetted statisticResult: ${statisticResult}`);

    switch(compare.operator){
        case "eq":
            return (statisticResult === compare.value);
        case "ne":
            return (statisticResult != compare.value);
        case "lt":
            return (statisticResult < compare.value);
        case "lte":
            return (statisticResult <= compare.value);
        case "gt":
            return (statisticResult > compare.value);
        case "gte":
            return (statisticResult >= compare.value);
        case "between":
            return (statisticResult > compare.left && statisticResult > compare.right);
        case "betweenLeft":
            return (statisticResult >= compare.left && statisticResult > compare.right);
        case "betweenRight":
            return (statisticResult > compare.left && statisticResult >= compare.right);
        case "betweenBoth":
            return (statisticResult >= compare.left && statisticResult >= compare.right);
        default:
            return false;
    }
}


/**
 * 根据计算规则从数组中取出统计值
 * @param {Array} docs 数据来源
 * @param {Object} fetch  {path:取值路径, method:统计方法, default:未取得值时使用的默认值, fetch:支持内嵌数组的递归}
 */
function fetchData({docs, fetch}){
    let temp;
    switch(typeof fetch.path){
        case 'string':
            temp =
            _.filter(docs.map(doc=>_.get(doc,
                fetch.path,
                fetch.default != undefined?fetch.default:undefined
                )),
                (item)=>{
                    return item != undefined
                }
            );
            break;
        case 'object':
            if(Array.isArray(fetch.path)){
                temp = _.filter(docs.map(doc=>{
                    let tempValue = [];
                    for(let index in fetch.path){
                        tempValue.push(
                            _.get(doc,
                                fetch.path[index],
                                (Array.isArray(fetch.default) && (fetch.default[index]!=undefined))?fetch.default[index]:undefined
                            )
                        )
                    }
                    return tempValue;
                }),
                (item)=>{
                    return !item.includes(undefined);
                }
                );
            }else{
                console.log('fetch.path is not an array')
            }
            break;
        default:
            break;
    }

    if(Array.isArray(temp) && fetch.fetch){
        temp = _.map(
            temp,
            (item)=>{
                return fetchData({
                    docs: item,
                    fetch: fetch.fetch
                })
            }
        )
    }

    return getStatisticResult({
        method: fetch.method,
        datas: temp
    });
}

/**
 * 从请求中解析出补偿值或使用默认补偿值
 * @param {Object} offset {default, fromCtx, fetch}
 * @param {Object} ctx
 */
function getOffset(offset, ctx){
    let temp = offset.default;
    if(offset.fromCtx && offset.fetch){
        let datas = _.get(ctx, offset.fromCtx, []);
        if(!Array.isArray(datas)){
            datas = [datas];
        }
        temp = fetchData({
            docs: datas,
            fetch: offset.fetch
        })
    }
    return temp;
}

function flattenRule(obj, target={}, currentPath=[]){
    for(let key in obj){
        let item = obj[key];
        if(item.rule){
            if(item.type == 'array'){
                flattenRule(item.rule, target, currentPath.concat([`${key}[x]`]))
            }else if(item.type == 'object'){
                flattenRule(item.rule, target, currentPath.concat([key]))
            }
        }
        target[currentPath.concat([key]).join('.')] = {
            type: item.type,
            required: item.required,
            description: item.description
        }
    }
    return target
}

function flattenJson(obj, target={}, currentPath=[]){
    for(let key in obj){
        let item = obj[key];
        if(typeof item == 'object'){
            if(Array.isArray(item) && item.length>0){
                if(typeof item[0] == 'object'){
                    flattenJson(item[0], target, currentPath.concat([`${key}[x]`]))
                }else{
                    target[currentPath.concat([key]).join('.')] = {
                        type: 'array',
                        description: `固定传入:${item}`
                    }
                }
            }else if(Array.isArray(item) && item.length == 0){
                target[currentPath.concat([key]).join('.')] = {
                    type: 'array',
                    description: `固定传入:空数组`
                }
            }else{
                flattenJson(item, target, currentPath.concat([key]))
            }
        }else{
            target[currentPath.concat([key]).join('.')] = {
                type: (typeof item),
                description: `固定传入:${item}`
            }
        }
    }
    return target
}

function flattenPath(obj, target={}, currentPath=[]){
    for(let key in obj){
        if(typeof obj[key] != 'object'){
            target[currentPath.concat([key]).join('.')] = obj[key];
        }else{
            flattenPath(obj[key], target, currentPath.concat([key]));
        }
    }
    return target
}

function formUrl({dbType, connectStr, dbName, login, password}){
    switch(dbType){
        case 'mongodb':
            return `mongodb://${login?(login+':'+password+'@'):''}${connectStr}${dbName?'/'+dbName:''}`
        case 'mysql':
            return {
                host: connectStr.split(':')[0],
                port: connectStr.split(':')[1],
                user: login,
                password: password,
                database: dbName
            }
        default:
            break;
    }
}

function formSchema({dbType, schema}){
    switch(dbType){
        case 'mongodb':
            return formMongoSchema(schema);
        case 'mysql':
            return formSQLSelect(schema);
        default:
            break;
    }
}

function formSQLSelect(schema){
    return Object.keys(schema);
}

function formMongoSchema(schema){
    if(Object.keys(schema).includes('type') && MONGO_DATA_TYPES.includes(schema.type)){
        let temp;
        switch(schema.type){
            case 'String':
                temp = {
                    ...schema
                };
                temp.type = String;
                return temp;
            case 'Number':
                temp = {
                    ...schema
                };
                temp.type = Number;
                return temp;
            case 'Boolean':
                temp = {
                    ...schema
                };
                temp.type = Boolean;
                return temp;
            case 'Date':
                temp = {
                    ...schema
                };
                temp.type = Date;
                return temp;
            case 'ObjectId':
                temp = {
                    ...schema
                };
                temp.type = mongoose.Types.ObjectId;
                return temp;
            case 'Object':
                temp = {
                    ...schema
                };
                temp.type = Object;
                return temp;
            case 'Mixed':
                temp = {
                    ...schema
                };
                temp.type = Object;
                return temp;
            case 'Array':
                temp = {
                    ...schema
                };
                temp.type = Array;
                return temp;
            default:
                break;
        }
    }else{
        let temp = {};
        for(let key in schema){
            if(Array.isArray(schema[key])){
                let arr = [];
                for(let item of schema[key]){
                    arr.push(formMongoSchema(item))
                }
                temp[key] = arr;
            }else if(typeof schema[key] == 'object'){
                temp[key] = formMongoSchema(schema[key]);
            }
        }
        return temp;
    }
}

function convertMysqlType(Type){
    if(/char/.test(Type) || /blob/.test(Type) || /text/.test(Type) || /enum/.test(Type) || /set/.test(Type)){
        return "String";
    }else if(/int/.test(Type) || /float/.test(Type) || /double/.test(Type) || /decimal/.test(Type)){
        return "Number";
    }else if(/date/.test(Type) || /time/.test(Type) || /year/.test(Type)){
        return "String";
    }
}

function parseMysqlStructure(structure){
    let temp = {};
    for(let desc of structure){
        temp[desc.Field] = {
            type: convertMysqlType(desc.Type)
        }
    }
    return temp;
}

function parseMongodbStructure(structure){
    for(let key in structure){
        if(key == '_id' || (['object','undefined'].includes(typeof structure[key]) && !structure[key]) ){
            delete structure[key];
        }else{
            if(structure[key].constructor.name != "Object"){
                let type = structure[key].constructor.name;
                if(type == 'ObjectID'){
                    type = 'ObjectId';
                }
                structure[key] = {
                    type
                }
            }else{
                structure[key] = parseMongodbStructure(structure[key])
            }
        }
    }
    return structure;
}

function getRequiredKeys(schema, arr=[], path=[]){
    if(Object.keys(schema).includes('type')){
        return schema.required;
    }else{
        for(let key in schema){
            if(typeof schema[key] == 'object'){
                let required = getRequiredKeys(schema[key], arr, path.concat([key]))
                if(required && !Array.isArray(required)){
                    arr.push(path.concat([key]).join('.'));
                }
            }
        }
    }
    return arr;
}

function getRefKeys(schema, arr=[], path=[]){
    if(Object.keys(schema).includes('type') && schema.type == "ObjectId"){
        return schema.ref;
    }else{
        for(let key in schema){
            if(typeof schema[key] == 'object'){
                let ref = getRefKeys(schema[key], arr, path.concat([key]))
                if(ref && !Array.isArray(ref)){
                    arr.push({
                        path: path.concat([key]).join('.'),
                        ref
                    });
                }
            }
        }
    }
    return arr;
}

function fetchParams(str, regex){
    let replacers = str.match(regex);
    if(replacers && Array.isArray(replacers)){
        return replacers.map(replacer=>replacer.slice(2,-1));
    }else{
        return [];
    }
}

function parseMerge(mergeConfig, target={}, currentPath=[]){
    for(let key in mergeConfig){
        let item = mergeConfig[key];
        let type;
        let description = "";
        if(item.convert){
            type = item.convert.type;
            if(item.convert.stringify){
                description += '字符串化JSON';
            }
            if(item.convert.toXml){
                description += '转化成XML字符串';
                if(item.convert.cdata){
                    description += ',使用CDATA包裹子标签数据';
                }
            }
            if(item.convert.encrypt){
                description += '加密数据';
                if(item.convert.encryptMethod){
                    description += `,加密方法:${item.convert.encryptMethod}`;
                }
                if(item.convert.coding){
                    description += `,编码:${item.convert.coding}`;
                }
            }
            if(Array.isArray(item.convert.enum) && item.convert.enum.length>0){
                description += `取值:${item.convert.enum.map(item=>item.value)}${item.convert.default?','+item.convert.default:''}`;
            }
        }
        target[currentPath.concat([key]).join('.')] = {
            type,
            description: (item.convert&&item.convert.itemType)?'':description
        }
        if(item.convert && item.convert.itemType){
            target[currentPath.concat([key]).join('.')+'[x]'] = {
                type: item.convert.itemType,
                description
            }
        }
        if(item.convert && item.convert.return){
            if(item.convert.type == 'Array'){
                parseMerge(item.convert.return, target, currentPath.concat([key+'[x]']))
            }else if(item.convert.type == 'Object'){
                parseMerge(item.convert.return, target, currentPath.concat([key]))
            }
        }
    }
    return target;
}

function parseReturn(returnConfig, target={}, currentPath=[]){
    for(let key in returnConfig){
        let item = returnConfig[key];
        if(item.from == 'result'){
            let type;
            if(item.convert){
                type = item.convert.type;
            }
            target[currentPath.concat([item.path]).join('.')] = {
                type
            }
            if(item.convert && item.convert.return){
                parseReturn(item.convert.return, target, currentPath.concat([item.path]))
            }
        }
    }
    return target
}


const typeMap = {
    "string": "String",
    "int": "Number",
    "boolean": "Boolean",
    "array": "Array",
    "object": "Object"
}

function recusiveValidator2Return(validator, returnConfig={}){
    for(let key in validator){
        let param = validator[key];
        returnConfig[key] = {
            from: 'result',
            path: key
        };
        if(param.type == 'array'){
            returnConfig[key].convert = {
                type: 'Array',
                itemType: 'String'
            }
            if(param.itemType){
                returnConfig[key].convert.itemType = typeMap[param.itemType];
            }
        }
        if(param.type == "object"){
            returnConfig[key].convert = {
                type: 'Object',
                useResult: true
            }
        }
        if(param.rule && (param.type == "object" || param.itemType == "object")){
            returnConfig[key].convert.useResult = false;
            returnConfig[key].convert.return = {};
            recusiveValidator2Return(param.rule, returnConfig[key].convert.return)
        }
    }
}

function mergeObj(obj, path, type){
    let value;
    switch(type){
        case 'Object':
            value = {};
            break;
        case 'Array':
            value = [];
            break;
        case 'String':
            value = "字符串数据";
            break;
        case 'Number':
            value = 123;
            break;
        case 'Boolean':
            value = true;
            break;
        default:
            break;
    }
    _.set(obj, path.replace(/\[x\]/g, '.0'), value);
}
