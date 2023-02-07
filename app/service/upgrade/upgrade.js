'use strict';
const _ = require('lodash');
const moment = require('moment');
moment.locales('zh-cn');
const Service = require('egg').Service;

class UpgradeService extends Service {
    /**
     * 升级版本1接口到版本2 box:
     * 
     * @param {String}      api_id 接口id
     */
    async upgradeApiToBox ({api_id}){
        const {ctx:{model}, logger, app:{mongoose:{Types:{ObjectId}}}} = this;
        try{
            const apiConfig = await model.ApiConfig.findById(api_id).populate({
                path: 'app_oid',
                select: 'company'
            }).lean();
            let requestConfig = _.pick(apiConfig, ["cache",
                "host",
                "url",
                "protocal",
                "method",
                "funcName",
                "sign",
                "mock",
                "bodyConfig",
                "dataType",
                "convertText"]);

            requestConfig._id = ObjectId();

            //前置请求
            let preRequestConfig, preDataConfig, preDataParamsAsInput, preReturnDataConfig, preReturnHeaderConfig, preDataConfigName, preRequestConfigName, preReturnDataConfigName, preReturnHeaderConfigName;
            if(apiConfig.pre && apiConfig.pre.hasPre){
                let preApiName = apiConfig.pre.apiName;

                const preApiConfig = await model.ApiConfig.findOne({
                    app_oid: apiConfig.app_oid,
                    name: preApiName
                }).populate({
                    path: 'app_oid',
                    select: 'company'
                }).lean();

                preRequestConfig = _.pick(preApiConfig, ["cache",
                "host",
                "url",
                "protocal",
                "method",
                "funcName",
                "sign",
                "mock",
                "bodyConfig",
                "dataType",
                "convertText"]);
                preRequestConfig._id = ObjectId();
            
                preRequestConfigName = preApiConfig.name + "请求配置";
                //preRequestObj = await model.RequestBlock(preRequestConfig).save();

                if(preApiConfig.data || preApiConfig.dataMerge){
                    let preData = {}

                    if(preApiConfig.data){
                        for(let key in preApiConfig.data){
                            if(typeof preApiConfig.data[key] != "object"){
                                preData[key] = {
                                    from: "value",
                                    value: preApiConfig.data[key],
                                    path: key
                                }
                            }
                        }
                    }

                    if(preApiConfig.dataMerge){
                        let result = fromReturn(preApiConfig.dataMerge);
                        preDataParamsAsInput = result.paramsAsInput;
                        preData = _.merge(preData, result.rtn);
                    }

                    preDataConfig = {
                        return: preData
                    }
                    preDataConfig._id = ObjectId();
                    preDataConfigName = preApiConfig.name + "入参配置";
                    //preDataObj = await model.DataBlock(preDataConfig).save();
                }

                if(apiConfig.pre.processReturn){
                    preReturnDataConfig = {
                    }
                    let preReturnData = {}
                    preReturnHeaderConfig = {
                    }
                    let preReturnHeader = {}
                    for(let path in apiConfig.pre.processReturn){
                        let toRequest = apiConfig.pre.processReturn[path];
                        if(toRequest.body){
                            preReturnData[toRequest.body.name] = {
                                from: 'result',
                                path
                            }
                        }
                        if(toRequest.query){
                            preReturnData[toRequest.query.name] = {
                                from: 'result',
                                path
                            }
                        }
                        if(toRequest.header){
                            preReturnHeader[toRequest.header.name] = {
                                from: 'result',
                                path
                            }
                        }
                    }
                    preReturnDataConfigName = apiConfig.name + "前置返回入参配置";
                    preReturnHeaderConfigName = apiConfig.name + "前置返回Header配置";
                    preReturnDataConfig.return = preReturnData;
                    preReturnDataConfig._id = ObjectId();
                    // if(Object.keys(preReturnData).length>0){
                    //     preReturnDataObj = await model.DataBlock(preReturnDataConfig).save();
                    // }
                    
                    preReturnHeaderConfig.return = preReturnHeader;
                    preReturnHeaderConfig._id = ObjectId();
                    // if(Object.keys(preReturnHeader).length>0){
                    //     preReturnHeaderObj = await model.DataBlock(preReturnHeaderConfig).save();
                    // }
                    
                }
            }

            let signExtraConfig, signParamsAsInput, signInputDataAsInput, signExtraonfigName;
            if(apiConfig.sign && apiConfig.sign.enabled){
                
                signExtraConfig = {
                }
                signExtraonfigName = apiConfig.name + "额外签名数据配置";
                signExtraConfig._id = ObjectId();
                let signExtraData = {}

                if(apiConfig.sign.useData){
                    //request 的 signData 中加入 inputData中的内容
                    signInputDataAsInput = true
                }

                if(apiConfig.sign.addedParam && Object.keys(apiConfig.sign.addedParam).length>0){
                    let result = fromReturn(apiConfig.sign.addedParam);
                    signParamsAsInput = result.paramsAsInput;
                    signExtraData = _.merge(signExtraData, result.rtn);
                    signExtraConfig.return = signExtraData;
                    //signExtraDataObj = await model.DataBlock(signExtraConfig).save();
                }
            }

            //let requestObj = await model.RequestBlock(requestConfig).save();

            let {rtn: dataReturnConfig} = fromReturn(apiConfig.dataMerge);

            let dataConfig = {
                return: dataReturnConfig
            }
            dataConfig._id = ObjectId();

            //let dataObj = await model.DataBlock(dataConfig).save();

            let {rtn: returnReturnConfig, paramsAsInput: returnParamsAsInput} = fromReturn(apiConfig.return);

            let returnConfig = {
                return: returnReturnConfig
            }

            returnConfig._id = ObjectId();

            //let returnObj = await model.DataBlock(returnConfig).save();

            let box = {
                company: apiConfig.app_oid?apiConfig.app_oid.company:{},
                tag_oid: apiConfig.tag_oid,
                name: apiConfig.name,
                topology: {
                    blocks:{
                    },
                    end: ""
                }
            }

            box.topology.blocks[dataConfig._id] = {
                type: "data",
                name: apiConfig.name + "入参配置",
                block_oid: dataConfig._id,
                inputData: ["params"],
                blockConfig: dataConfig
            }

            box.topology.blocks[requestConfig._id] = {
                type: "request",
                name: apiConfig.name + "请求配置",
                block_oid: requestConfig._id,
                inputData: [dataConfig._id],
                headerData: [],
                signData: [],
                blockConfig: requestConfig
            }

            box.topology.blocks[returnConfig._id] = {
                type: "data",
                name: apiConfig.name + "返回配置",
                block_oid: returnConfig._id,
                inputData: [requestConfig._id],
                blockConfig: returnConfig
            }
            box.topology.end = returnConfig._id;

            if(returnParamsAsInput){
                box.topology.blocks.formOutput.inputData.push("params");
            }

            if(preDataConfig){
                box.topology.blocks[preDataConfig._id] = {
                    type: "data",
                    name: preDataConfigName,
                    block_oid: preDataConfig._id,
                    inputData: [],
                    blockConfig: preDataConfig
                }
                if(preDataParamsAsInput){
                    box.topology.blocks[preDataConfig._id].inputData.push("params");
                }
            }

            if(preRequestConfig){
                box.topology.blocks[preRequestConfig._id] = {
                    type: "request",
                    name: preRequestConfigName,
                    block_oid: preRequestConfig._id,
                    inputData: [],
                    headerData: [],
                    signData: [],
                    blockConfig: preRequestConfig
                }
                if(preDataConfig){
                    box.topology.blocks[preRequestConfig._id].inputData.push(preDataConfig._id);
                }
            }

            if(preReturnDataConfig){
                box.topology.blocks[preReturnDataConfig._id] = {
                    type: "data",
                    name: preReturnDataConfigName,
                    block_oid: preReturnDataConfig._id,
                    inputData: [],
                    blockConfig: preReturnDataConfig
                }
                if(preRequestConfig){
                    box.topology.blocks[preReturnDataConfig._id].inputData.push(preRequestConfig._id);
                }
                box.topology.blocks[requestConfig._id].inputData.push(preReturnDataConfig._id);
            }

            if(preReturnHeaderConfig){
                box.topology.blocks[preReturnHeaderConfig._id] = {
                    type: "data",
                    name: preReturnHeaderConfigName,
                    block_oid: preReturnHeaderConfig._id,
                    inputData: [],
                    blockConfig: preReturnHeaderConfig
                }
                if(preRequestConfig){
                    box.topology.blocks[preReturnHeaderConfig._id].inputData.push(preRequestConfig._id);
                }
                box.topology.blocks[requestConfig._id].headerData.push(preReturnHeaderConfig._id);
            }

            if(signInputDataAsInput){
                box.topology.blocks[requestConfig._id].signData = _.clone(box.topology.blocks[requestConfig._id].inputData);
            }

            if(signExtraConfig){
                box.topology.blocks[signExtraConfig._id] = {
                    type: "data",
                    name: signExtraonfigName,
                    block_oid: signExtraConfig._id,
                    inputData: [],
                    blockConfig: signExtraConfig
                }
                if(signParamsAsInput){
                    box.topology.blocks[signExtraConfig._id].inputData.push("params");
                }
                box.topology.blocks[requestConfig._id].signData.push(signExtraConfig._id);
            }

            let boxObj = await model.Box(box).save();

            return boxObj

        }catch(e){
           console.error(e) 
        }
    }
}

module.exports = UpgradeService;

function fromReturn(returnConfig, paramsAsInput=false){
    for(let key in returnConfig){
        let item = returnConfig[key];
        if(item.from == 'params'){
            item.from == 'result';
            paramsAsInput = true;
            paramsPaths.push(item.path);
        }
        if(item.convert && item.convert.return){
            let result = fromReturn(item.convert.return, paramsAsInput);
            item.convert.return = result.rtn;
            paramsAsInput = result.paramsAsInput;
        }
    }
    return {rtn:returnConfig, paramsAsInput}
}