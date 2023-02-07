'use strict';
const mongoose = require('mongoose');
const moment = require('moment');
moment.locale('zh-cn');
const Service = require('egg').Service;
const DB = require('../../../lib/db');
const _ = require('lodash');
const crypto = require('crypto');
const { query } = require('../../../const/schema/queryConfig');

class sourceService extends Service {

    async addSourceConfig({app_id, sourceName, description, dbType, connectStr, dbName, login, password}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let dataSource = await model.DataSource({
            app_oid: ObjectId(app_id),
            sourceName,
            description,
            dbType,
            connectStr,
            dbName,
            login,
            password
        }).save();

        return dataSource;
    }

    async updateSourceConfig({source_id, dbType, dbName, description, connectStr, login, password}){
        const {ctx: { model }} = this;
        let setter = {
            dbType,
            dbName,
            description,
            connectStr,
            login,
            password
        };
        let dataSource = await model.DataSource.findByIdAndUpdate(source_id, {"$set": setter});

        // 新配置要重新连接，所以断开当前链接，不用同步等待
        DB.breakConnect({_id: dataSource._id, dbType: dataSource.dbType});

        return dataSource;
    }

    async listSourceConfig({app_id, search, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let condition = {
            app_oid: ObjectId(app_id)
        };

        if(search){
            condition.sourceName = {"$regex": search};
        }

        let sort = {
            "created": -1
        }

        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }

        const list = await model.DataSource.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();

        for(let index in list){
            let source = list[index];
            source.modelCount = await model.CustomizedModel.count({
                source_oid: ObjectId(source._id)
            });
            //账号密码脱敏
            source.login = "*****";
            source.password = "*****";
        }

        let count = await model.DataSource.count(condition);
        return {list, count};
    }

    async addCustomizeModel({source_id, collectionName, schema}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let customizeModel = await model.CustomizedModel.findOne(
            {
                source_oid: ObjectId(source_id),
                name: collectionName
            }
        );

        if(!customizeModel){
            customizeModel = await model.CustomizedModel(
                {
                    source_oid: ObjectId(source_id),
                    name: collectionName,
                    modelSchema: schema
                }
            ).save();
        }

        return customizeModel;
    }

    async updateCustomizeModel({model_id, schema}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;
        return await model.CustomizedModel.findOneAndUpdate({_id: ObjectId(model_id)}, {
            "$set": {
                modelSchema: schema
            }
        }, {"upsert":true});
    }

    async listCustomizeModel({source_id, search, page=1, pageSize=10, sortField, sortOrder}){
        const {ctx: { model }, app: {mongoose: {Types: { ObjectId }}}} = this;

        let condition = {
            source_oid: ObjectId(source_id)
        };

        if(search){
            condition.name = {"$regex": search};
        }

        let sort = {
            "created": -1
        }

        if(sortField){
            sort = {};
            sort[sortField] = sortOrder == "ascend" ? 1: -1;
        }

        const list = await model.CustomizedModel.find(condition)
        .sort(sort)
        .skip((Number(page)-1)*Number(pageSize))
        .limit(Number(pageSize))
        .lean();
        let count = await model.CustomizedModel.count(condition);
        return {list, count};
    }

    async getTables({app_id, sourceName}){
        const { ctx } = this;

        const dataSource = await ctx.model.DataSource.findOne({
            app_oid: mongoose.Types.ObjectId(app_id),
            sourceName: sourceName
        }).lean();

        const {_id, dbType, connectStr, dbName, login, password} = dataSource;
        let tables = await DB.showTable({_id, dbType, connectStr, dbName, login, password});

        return {dbType, tables};
    }

    async getStructure({app_id, sourceName, collectionName}){
        const { ctx } = this;

        const dataSource = await ctx.model.DataSource.findOne({
            app_oid: mongoose.Types.ObjectId(app_id),
            sourceName: sourceName
        }).lean();

        const {_id, dbType, connectStr, dbName, login, password} = dataSource;

        let structure = await DB.showModel({_id, dbType, connectStr, dbName, login, password, collectionName});

        return {dbType, structure, source_id: dataSource._id};
    }

    async getData({app_id, sourceName, collectionName, query, joins}){
        const {ctx: { model, helper }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let {retModel, dbType, conn, populations} = await helper.customizeModel({
            app_id,
            sourceName,
            collectionName,
            joins
        });

        let data;

        switch(dbType){
            case 'mongodb':
                let instance = retModel.find(query?JSON.parse(query):{})
                if(Array.isArray(joins) && joins.length>0){
                    for(let key in joins){
                        let join = joins[key];
                        instance.populate({
                            path: join.joinKey
                        })
                    }
                }
                data = await instance.lean();
                break;
            case 'mysql':
                let finalQuery = "";
                let joinQuery = "";
                if(Array.isArray(joins) && joins.length>0){

                    for(let key in joins){
                        let join = joins[key];
                        joinQuery += ` ${join.joinType} ${join.joinModel} ON ${collectionName+'.'+join.joinKey}=${join.joinModel+'.'+join.targetKey}`
                    }

                }

                data = await new Promise((resolve, reject)=>{
                    finalQuery += `SELECT * FROM ${collectionName}`
                    +joinQuery
                    +`${query?' WHERE '+query:''}`;

                    conn.query(finalQuery, function(error, results, fields){
                        if(error){
                            reject(error);
                        }else{
                            resolve(results);
                        }
                    })
                })
                break;
            default:
                break;
        }

        return data;
    }

    async getDataByConfig({_id, params, queryLog={}}) {
        const {ctx: { model, helper }, logger, app: {mongoose: {Types: {ObjectId}}}} = this;

        let result = {
            result: true
        };

        // 日志
        queryLog.queryConfig_oid = ObjectId(_id);
        queryLog.created = new moment().format('YYYY-MM-DD HH:mm:ss');
        queryLog.parameter = JSON.stringify(params, null, 2);
        if(!queryLog.process){
            queryLog.process = [];
        }
        let t0, t1, tt;
        t0 = new Date().getTime();

        try {
            // 获取查询配置
            t1 = new Date().getTime();
            let queryConfigInfo = await model.QueryConfig.findById(_id).lean();
            if (!queryConfigInfo) {
                throw {message: '未查询到该查询配置'};
            }

            // 获取数据库配置
            let dataSource = await model.DataSource.findById(queryConfigInfo.source_oid).lean();
            if (!dataSource) {
                // 该dataSource配置查询不到了
                throw {message: '未查询到该数据库配置'};
            }

            // 获取 公用参数 配置
            let customConfig = {};
            const customizeConfig = await model.ConsultCustomizeConfig.findOne({
                app_oid: dataSource.app_oid
            }).lean();
            if(customizeConfig && customizeConfig.config){
                customConfig = customizeConfig.config;
            }
            tt = new Date().getTime();
            queryLog.process.push({
                state: "getConfig",
                time: tt-t1,
            });

            t1 = new Date().getTime();
            // 解析query的信息
            let query;
            if (dataSource.dbType === 'mongodb') {
                if (!queryConfigInfo.query || helper.isEmptyObj(queryConfigInfo.query)) {
                    query = {}
                } else {
                    query = parseQueryRuleToMongo({customConfig, params}, queryConfigInfo.query);
                }
            } else if (dataSource.dbType === 'mysql') {
                if (!queryConfigInfo.query || helper.isEmptyObj(queryConfigInfo.query)) {
                    query = ""
                } else {
                    query = parseQueryRuleToMysql({customConfig, params}, queryConfigInfo.query);
                    query = " where " + query;
                }
            } else {
                throw {message: '暂不支持该种类型的查询'};
            }

            // 解析extra_operation的信息
            if (queryConfigInfo.extra_operation && queryConfigInfo.extra_operation.skip) {
                queryConfigInfo.extra_operation.skip = Number(parseData({customConfig, params}, queryConfigInfo.extra_operation.skip)) || 0;
            }
            if (queryConfigInfo.extra_operation && queryConfigInfo.extra_operation.limit) {
                queryConfigInfo.extra_operation.limit = Number(parseData({customConfig, params}, queryConfigInfo.extra_operation.limit)) || 0;
            }

            tt = new Date().getTime();
            queryLog.process.push({
                state: "parseData",
                time: tt-t1,
            });


            t1 = new Date().getTime();
            let conn = await DB.getConnect({_id: dataSource._id, dbType: dataSource.dbType, connectStr: dataSource.connectStr, dbName: dataSource.dbName, login: dataSource.login, password: dataSource.password});

            if (dataSource.dbType === 'mongodb') {
                // 生成model
                let customizedModel = await model.CustomizedModel.findOne({name: queryConfigInfo.collection_name, source_oid: ObjectId(queryConfigInfo.source_oid)}).lean();
                let schema = helper.formSchema({dbType: dataSource.dbType, schema: customizedModel.modelSchema})
                let tempModel;
                if (conn.models[queryConfigInfo.collection_name]) {
                    tempModel = conn.models[queryConfigInfo.collection_name]
                } else {
                    tempModel = conn.model(queryConfigInfo.collection_name, new mongoose.Schema(schema, {collection: customizedModel.name}));
                }
                queryLog.actual_parameter = {
                    collection_name: queryConfigInfo.collection_name,
                    query: query,
                }

                // 判断操作类型
                switch (queryConfigInfo.operation) {
                    case 'find':
                        // 查询数据库
                        tempModel = tempModel.find(query);
                        // 动态增加额外操作，select、sort、skip、limit
                        if (queryConfigInfo.extra_operation.select && queryConfigInfo.extra_operation.select.length>0) {
                            tempModel = tempModel.select(queryConfigInfo.extra_operation.select);
                            queryLog.actual_parameter.select = queryConfigInfo.extra_operation.select;
                        }
                        if (queryConfigInfo.extra_operation.sort && !helper.isEmptyObj(queryConfigInfo.extra_operation.sort)) {
                            tempModel = tempModel.sort(queryConfigInfo.extra_operation.sort);
                            queryLog.actual_parameter.sort = queryConfigInfo.extra_operation.sort;
                        }
                        if (queryConfigInfo.extra_operation.skip) {
                            tempModel = tempModel.skip(queryConfigInfo.extra_operation.skip);
                            queryLog.actual_parameter.skip = queryConfigInfo.extra_operation.skip;
                        }
                        if (queryConfigInfo.extra_operation.limit) {
                            tempModel = tempModel.limit(queryConfigInfo.extra_operation.limit);
                            queryLog.actual_parameter.limit = queryConfigInfo.extra_operation.limit;
                        }
                        break;
                    case 'count':
                        tempModel = tempModel.count(query);break;
                    case 'distinct':
                        tempModel = tempModel.distinct(queryConfigInfo.extra_operation.select.toString(),query); break;
                    default: tempModel = tempModel.find(query);
                }
                queryLog.actual_parameter = JSON.stringify(queryLog.actual_parameter, null, 2);
                result.data = await tempModel.lean();
            } else if (dataSource.dbType === 'mysql') {
                query = " from " + queryConfigInfo.collection_name + query;
                switch (queryConfigInfo.operation) {
                    case 'find':
                        if (queryConfigInfo.extra_operation.select && queryConfigInfo.extra_operation.select.length>0) {
                            query = "select " + queryConfigInfo.extra_operation.select.toString() + query;
                        } else {
                            query = "select *" + query;
                        }

                        if (queryConfigInfo.extra_operation.sort && !helper.isEmptyObj(queryConfigInfo.extra_operation.sort)) {
                            query += " order by ";
                            let tempSort = queryConfigInfo.extra_operation.sort;
                            Object.keys(tempSort).forEach(function(key) {
                                if (tempSort[key]) {
                                    query += key + " ASC ";
                                } else {
                                    query += key + " DESC ";
                                }
                            })
                        }

                        if (queryConfigInfo.extra_operation.limit) {
                            query += " limit " + queryConfigInfo.extra_operation.limit;
                        }

                        if (queryConfigInfo.extra_operation.skip) {
                            query += " offset " + queryConfigInfo.extra_operation.skip;
                        }
                        break;
                    case 'count':
                        query = 'select count(*)  as count' + query; break;
                    case 'distinct':
                        query = 'select distinct ' + queryConfigInfo.extra_operation.select.toString() + ' ' + query;
                        break;
                }
                // 查询
                result.data = await DB.mysqlQuery(conn, query, []);
                queryLog.actual_parameter = query;
            }
            tt = new Date().getTime();
            queryLog.process.push({
                state: "queryDatabase",
                time: tt-t1,
            });
            queryLog.status = 'success';
        } catch (e) {
            tt = new Date().getTime();
            queryLog.process.push({
                state: "error",
            });
            queryLog.status = 'fail';
            queryLog.error_message = e.stack.toString() || e.message;
            result.result = false;
            result.message = e.message || e.stack.toString();
        }
        queryLog.total_time = tt-t0;

        await model.QueryConfigLog(queryLog).save();

        return result;
    }

    async getApiConfiguredQuery({app_id}){
        const {ctx: { model, helper }, app: {mongoose: {Types: {ObjectId}}, _}} = this;

        let configList = await model.QueryConfig.find({
            app_oid: ObjectId(app_id)
        }).populate({
            path: "collection_oid",
            select: "name",
            populate: {
                path: "source_oid",
                select: "sourceName"
            }
        }).lean();

        //遍历获取 数据库->表->查询 树
        let list = [];
        let map = {}

        for(let queryItem of configList){

            let source_oid = queryItem.collection_oid.source_oid._id;
            let sourceName = queryItem.collection_oid.source_oid.sourceName;
            let collection_oid = queryItem.collection_oid._oid;
            let collectionName = queryItem.collection_oid.name;
            let query_oid = queryItem._id;
            let queryName = queryItem.name;

            if(!map[source_oid]){
                map[source_oid] = {
                    sourceName,
                    children:{}
                }
            }
            if(!map[source_oid].children[collection_oid]){
                map[source_oid].children[collection_oid] = {
                    collectionName,
                    children: []
                }
            }

            map[source_oid].children[collection_oid].children.push({
                label: queryName,
                value: query_oid
            })
        }

        for(let source_id in map){
            let source = {
                label: map[source_id].sourceName,
                children: []
            }
            let collectionMap = map[source_id].children;
            for(let collection_id in collectionMap){
                source.children.push({
                    label: collectionMap[collection_id].collectionName,
                    children: collectionMap[collection_id].children
                })
            }
            list.push(source)
        }

        return {list}
    }

    async fetchExistSchema({app_id, sourceName}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        const dataSource = await model.DataSource.findOne({
            app_oid: mongoose.Types.ObjectId(app_id),
            sourceName: sourceName
        }).lean();

        let source_id = dataSource._id
        let condition = {
            source_oid: source_id
        }

        const existSchemas = await model.CustomizedModel.distinct('name', condition);

        return {source_id, existSchemas};
    }

    async test({source_id}){
        const {ctx: { model, logger }, app} = this;

        const dataSource = await model.DataSource.findById(source_id);

        const {_id, dbType, connectStr, dbName, login, password} = dataSource;

        let result = false;

        try{
            let conn = await DB.getConnect({_id, dbType, connectStr, dbName, login, password});
            logger.info(conn);
            switch(dbType){
                case 'mongodb':
                    if(conn.readyState == "1"){
                        result = true;
                    }
                    break;
                case 'mysql':
                    if(conn.state == "authenticated"){
                        result = true;
                    }
                    break;
                default:
                    break;
            }
            if (result) {
                dataSource.tested = true;
            } else {
                dataSource.tested = false;
            }
            dataSource.testTime = new moment().format('YYYY-MM-DD HH:mm:ss');
            await dataSource.save();
        }catch(e){
            dataSource.tested = false;
            dataSource.testTime = new moment().format('YYYY-MM-DD HH:mm:ss');
            await dataSource.save();
        }

        return {result};
    }

    async saveQueryConfig({name, collection_name, operation, query, extra_operation, source_oid, app_oid, collection_oid, params_example}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let data = await model.QueryConfig({
            source_oid: ObjectId(source_oid),
            collection_oid: ObjectId(collection_oid),
            name,
            collection_name,
            operation,
            query,
            extra_operation,
            app_oid: ObjectId(app_oid),
            params_example
        }).save();

        return data;
    }

    async getQueryConfigDataBySource({source_oid, page, pageSize, collection_name, name, collection_oid}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let result;

        let condition = {
            source_oid: ObjectId(source_oid)
        }

        if(collection_oid){
            condition.collection_oid = collection_oid
        }

        if(collection_name){
            condition.collection_name = collection_name
        }

        if(name){
            condition.name = {"$regex": name}
        }

        let count = await model.QueryConfig.count(condition)

        let data = await model.QueryConfig.find(condition).skip((page-1)*pageSize).limit(pageSize).lean();

        result = {data, count}

        return result;
    }

    async getQueryConfigById(_id){
        const {ctx: { model } } = this;
        let data = await model.QueryConfig.findById(_id).lean();
        return data;
    }

    async deleteOneQueryConfigData({queryconfig_id}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let data = await model.QueryConfig.deleteOne({_id: ObjectId(queryconfig_id)});

        return data;
    }

    async updateQueryConfigData({queryconfig_id, name, collection_name, operation, query, extra_operation, params_example}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let condition = {
            "_id": ObjectId(queryconfig_id)
        }

        let update = {
            name,
            collection_name,
            operation,
            query,
            extra_operation,
            params_example
        }

        let data = await model.QueryConfig.findOneAndUpdate(condition, {$set: update}, {new: true})

        return data
    }

    async getModelSchemaData({collection_oid}){
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;

        let data = await model.CustomizedModel.findOne({"_id": ObjectId(collection_oid)});

        return data.modelSchema;
    }

    async getQueryLog({page, pageSize, queryConfig_id, status}) {
        const {ctx: { model }, app: {mongoose: {Types: {ObjectId}}}} = this;
        let query = {queryConfig_oid: ObjectId(queryConfig_id)};
        if (status) {
            query.status = {$in: status};
        }
        let total = await model.QueryConfigLog.count(query);
        let data = await model.QueryConfigLog.find(query).sort({created: -1}).skip((page-1)*pageSize).limit(pageSize).lean();

        return {total, data};
    }
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

// 解析规则成mysql查询
function parseQueryRuleToMysql({customConfig, params}, rule) {
    let result = "";
    if (rule.from === 'nest') {
        // 内嵌 需要继续解析
        if (Array.isArray(rule.path)){
            // 如果是array则对每个单独解析
            let tempResult = []
            rule.path.forEach(function(item) {
                tempResult.push(parseQueryRuleToMysql({customConfig, params}, item));
            })
            result += " ("
            let tempOperation = rule.type.substr(1);
            tempResult.forEach(function(item) {
                return result += item + " " + tempOperation + " "
            })
            result = result.slice(0, -(tempOperation.length + 1)) + ")";
        } else {
            result += parseQueryRuleToMysql({customConfig, params}, rule.path);
        }
    } else {
        // 最内层了，直接取值
        rule.path = parseData({customConfig, params}, rule);
        // TODO 洗数据 对值做处理
        switch (rule.type) {
            case '$eq':
                result += " = '" + rule.path + "' "; break;
            case '$in':
                result += " in (" + rule.path + ") "; break;
            case '$like':
                result += " like '%" + rule.path + "%' "; break;
            case '$regex':
                result += " REGEXP '" + rule.path + "' "; break;
            default:
                result += " = '" + rule.path + "' "; break;
        }
    }
    if (rule.key !== '') {
        result = " " + rule.key + result;
    }
    return result;
}

// 解析规则成mongo查询
function parseQueryRuleToMongo({customConfig, params}, rule) {
    let result = {};

    let tempResult;
    if (rule.from === 'nest') {
        // 内嵌，需要继续解析
        if (Array.isArray(rule.path)){
            // 如果是array则对每个单独解析
            tempResult = []
            rule.path.forEach(function(item) {
                tempResult.push(parseQueryRuleToMongo({customConfig, params}, item));
            })
        } else {
            tempResult = parseQueryRuleToMongo({customConfig, params}, rule.path);
        }
        if (rule.type === '$and'){
            // and 一般写法是把数组合并成一个json
            tempResult = mergeArrayJson(tempResult)
        } else if (rule.type === '$or'){
            tempResult = {$or: tempResult}
        }
    } else {
        // 最内层了，直接取值
        rule.path = parseData({customConfig, params}, rule);
        // TODO 洗数据 对值做处理
        switch (rule.type) {
            case '$eq':
                tempResult = rule.path; break;
            case '$in':
                tempResult = {$in: rule.path}; break;
            case '$nin':
                tempResult = {$nin: rule.path}; break;
            case '$like':
            case '$regex':
                tempResult = {$regex: rule.path}; break;
                break;
            default:
                tempResult = rule.path;
        }
    }

    // 如果有key则生成键值对，没有则直接返回
    if (rule.key === '') {
        result = tempResult
    } else {
        result[rule.key] = tempResult
    }

    return result;
}

/**
 * 根据映射取值
 * customConfig: 公用参数
 */
function parseData({customConfig={}, params={}}, config) {
    let returned;
    switch (config.from) {
        case 'system':
            returned = getSystemResult(config.path);
            break;
        case 'customConfig':
            let tempconfig = _.get(customConfig, config.path)
            returned = tempconfig.path || tempconfig.default;
            break;
        case 'value':
            returned = config.path;
            break;
        case 'params':
            returned = _.get(params, config.path);
    }
    // TODO 洗数据  config.convert
    return returned;
}

// 获取系统方法结果
function getSystemResult(method){
    switch(method){
        case "dateFormat":
            return moment().format('YYYY-MM-DD');
        case "dateFormatSecond":
            return moment().format('YYYY-MM-DD HH:mm:ss');
        case 'dateNow':
            return Date.now().toString();
        case 'secondNow':
            return Date.now().toString().slice(0,-3);
        case 'randomString':
            return crypto.createHash('sha1').update(Math.random().toString()).digest('hex').slice(0, 32);
        default:
            return;
    }
}

function stringConcat(expression, data){
    if(data){
        for(let key in data){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = data[key];
            expression = expression.replace(tempRegex, replaced);
            console.log(expression)
        }
    }
    return expression;
}

/**
 * 列表整合，类似于联表
 * @param {Array} lists 联表数据列表:data的相对路径path和联表字段refKey
 * @param {String} primaryKey 最终主字段
 * @param {*} data 数据来源
 */
function mergeList(lists, primaryKey, data){
    let preMergeObject = {};
    let returnedArray = [];
    if(lists){
        for(let listItem of lists){
            let list = _.cloneDeep(_.get(data, listItem.path));
            let refKey = listItem.refKey;
            if(Array.isArray(list)){
                for(let item of list){
                    if(preMergeObject[item[refKey]]){
                        preMergeObject[item[refKey]] = _.merge(preMergeObject[item[refKey]], item);
                    }else{
                        preMergeObject[item[refKey]] = item;
                    }
                }
            }
        }
    }
    for(let key in preMergeObject){
        preMergeObject[key][primaryKey] = key;
        returnedArray.push(preMergeObject[key]);
    }
    return returnedArray;
}

/**
 * 对象列表筛选
 * @param {*} path              要筛选的数组在data中的相对地址
 * @param {*} filter            筛选匹配json字符串
 * @param {*} data
 * @returns
 */
function filterList(path, filter, data){
    try{
        let filterObj = translateDataString(data, filter)
        return _.filter(_.get(data, path), filterObj);
    }catch(e){
        return _.get(data, path)
    }
}

function translateDataString(params, dataStr){
    if(params){
        for(let key in params){
            let tempRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
            let replaced = params[key];
            dataStr = dataStr.replace(tempRegex, replaced);
        }
    }
    return JSON.parse(dataStr);
}

// 合并json数组
function mergeArrayJson(data) {
    let result = {};
    if (!Array.isArray(data)){
        return data;
    }
    // 只合并了一层
    data.forEach(function(item) {
        Object.keys(item).forEach(function(key) {
            result[key] = item[key]
        })
    });
    return result;
}

module.exports = sourceService;
