'use strict';

const Controller = require('egg').Controller;
const { DB_TYPES } = require('../../const/module/customizeModel');

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    addSourceConfigRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sourceName: {
                type: 'string',
                required: true
            },
            description: {
                type: 'string',
                required: false
            },
            dbType: {
                type: 'enum',
                values: DB_TYPES
            },
            connectStr: {
                type: 'string',
                required: true
            },
            dbName: {
                type: 'string',
                required: false
            },
            login: {
                type: 'string',
                required: false
            },
            password: {
                type: 'string',
                required: false
            }
        },
    },
    updateSourceConfigRule: {
        params: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            description: {
                type: 'string',
                required: false
            },
            dbType: {
                type: 'enum',
                values: DB_TYPES,
                required: false
            },
            connectStr: {
                type: 'string',
                required: false
            },
            dbName: {
                type: 'string',
                required: false
            },
            login: {
                type: 'string',
                required: false
            },
            password: {
                type: 'string',
                required: false
            }
        }
    },
    listSourceConfigRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "dbType", "dbName" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        },
    },
    addCustomizeModelRule: {
        body: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            modelName: {
                type: 'string'
            },
            schema: {
                type: 'object'
            }
        }
    },
    updateCustomizeModelRule: {
        params: {
            model_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            schema: {
                type: 'object'
            }
        }
    },
    listCustomizeModelRule: {
        query: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            search: {
                type: 'string',
                required: false
            },
            page: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 1,
                min: 1
            },
            pageSize: {
                type: 'int',
                convertType: 'int',
                required: false,
                default: 20,
                min: 10,
                max: 200
            },
            sortField: {
                type: 'enum',
                required: false,
                values: [ "source_id" ]
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        }
    },
    getTableRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sourceName: {
                type: 'string',
                required: true
            }
        }
    },
    getStructureRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sourceName: {
                type: 'string',
                required: true
            },
            modelName: {
                type: 'string',
                required: true
            }
        }
    },
    getDataRule: {
        query: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sourceName: {
                type: 'string',
                required: true
            },
            modelName: {
                type: 'string',
                required: true
            },
            query: {
                type: 'string',
                required: false
            }
        }
    },
    autoConstructSchemaRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sourceName: {
                type: 'string',
                required: true
            }
        }
    },
    constructSelectedSchemaRule: {
        body: {
            app_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            sourceName: {
                type: 'string',
                required: true
            },
            preAddSchemas: {
                type: 'array',
                itemType: 'string',
                required: true
            }
        }
    },
    testRule: {
        body: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    analyseDataRule: {
        query: {
            source_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            model_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    postQueryConfigRule: {
        body: {
            name: {
                type: 'string',
                required: true
            },
            collection_name: {
                type: 'string',
                required: true
            },
            operation: {
                type: 'string',
                required: false
            },
            query: {
                type: 'object',
                required: true
            },
            extra_operation: {
                type: 'object',
                required: false
            },
            source_oid: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            app_oid: {
                type: 'string',
                required: true
            },
            collection_oid: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getQueryConfigDataRule: {
        query: {
            source_oid: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            collection_name: {
                type: 'string',
                required: false
            },
            name: {
                type: 'string',
                required: false
            },
            collection_oid: {
                type: 'string',
                required: false
            }
        }
    },
    getQueryConfigByIdRule: {
        query: {
            _id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    deleteQueryConfigDataRule: {
        body: {
            queryconfig_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    updateQueryConfigRule: {
        body: {
            queryconfig_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            name: {
                type: 'string',
                required: false
            },
            collection_name: {
                type: 'string',
                required: false
            },
            operation: {
                type: 'string',
                required: false
            },
            query: {
                type: 'object',
                required: false
            },
            extra_operation: {
                type: 'object',
                required: false
            }
        }
    },
    getModelSchemaDetailRule: {
        query: {
            collection_oid: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class sourceController extends Controller {
    async addSourceConfig() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.addSourceConfigRule);
        try{
            const {
                request:{
                    body:{
                        app_id,
                        sourceName,
                        description,
                        dbType,
                        connectStr,
                        dbName,
                        login,
                        password
                    }
                }
            } = ctx;

            let dataSource = await ctx.service.dataSource.sourceConfig
            .addSourceConfig({
                app_id,
                sourceName,
                description,
                dbType,
                connectStr,
                dbName,
                login,
                password
            })

            ctx.body = {
                result: true,
                dataSource
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async updateSourceConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateSourceConfigRule);
        try{
            const {
                params:{
                    source_id
                },
                request:{
                    body:{
                        description,
                        dbType,
                        connectStr,
                        dbName,
                        login,
                        password
                    }
                }
            } = ctx;

            let dataSource = await ctx.service.dataSource.sourceConfig
            .updateSourceConfig({source_id, dbType, dbName, description, connectStr, login, password})

            ctx.body = {
                result: true,
                dataSource
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async listSourceConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listSourceConfigRule);
        try{
            const {
                query:{
                    app_id,
                    search,
                    page,
                    pageSize,
                    sortField,
                    sortOrder
                }
            } = ctx;

            let { list, count } = await ctx.service.dataSource.sourceConfig
            .listSourceConfig({
                app_id,
                search,
                page,
                pageSize,
                sortField,
                sortOrder
            });

            ctx.body = {
                result: true,
                list,
                count,
                page,
                pageSize
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async addCustomizeModel(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.addCustomizeModelRule);
        try{

            const {
                request:{
                    body:{
                        source_id,
                        modelName,
                        schema
                    }
                }
            } = ctx;

            let customizeModel = await ctx.service.dataSource.sourceConfig
            .addCustomizeModel({source_id, collectionName: modelName, schema});

            ctx.body = {
                result: true,
                customizeModel
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async updateCustomizeModel(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateCustomizeModelRule);
        try{

            const {
                params: {
                    model_id
                },
                request:{
                    body:{
                        schema
                    }
                }
            } = ctx;

            let customizeModel = await ctx.service.dataSource.sourceConfig
            .updateCustomizeModel({model_id, schema});

            ctx.body = {
                result: true,
                customizeModel
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async listCustomizeModel(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.listCustomizeModelRule);
        try{
            const {
                query:{
                    source_id,
                    search,
                    page,
                    pageSize,
                    sortField,
                    sortOrder
                }
            } = ctx;

            let { list, count } = await ctx.service.dataSource.sourceConfig
            .listCustomizeModel({source_id, search, page, pageSize, sortField, sortOrder});

            ctx.body = {
                result: true,
                list,
                count,
                page,
                pageSize
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async getTable(){
        const { ctx, logger, app: {_} } = this;
        ctx.helper.validate(Rules.getTableRule);

        try {
            const {
                query:{
                    app_id,
                    sourceName
                }
            } = ctx;

            let {dbType, tables} = await ctx.service.dataSource.sourceConfig
            .getTables({app_id, sourceName});

            let {source_id, existSchemas} = await ctx.service.dataSource.sourceConfig
            .fetchExistSchema({app_id, sourceName});

            let preAddSchemas = _.pullAll(tables, existSchemas);

            ctx.body = {
                result: true,
                dbType,
                existSchemas,
                preAddSchemas
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async getStructure(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getStructureRule);

        try {
            const {
                query:{
                    app_id,
                    sourceName,
                    modelName
                }
            } = ctx;

            let {dbType, structure} = await ctx.service.dataSource.sourceConfig
            .getStructure({app_id, sourceName, collectionName: modelName});

            ctx.body = {
                result: true,
                dbType,
                structure
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async getData(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getDataRule);
        try{
            const {
                query:{
                    app_id,
                    sourceName,
                    modelName,
                    query
                }
            } = ctx;

            let data = await ctx.service.dataSource.sourceConfig
            .getData({app_id, sourceName, collectionName: modelName, query});

            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    // 根据配置获取数据
    async getDataByConfig() {
        const { ctx, logger } = this;
        try {
            const { params:{ config_id },request } = ctx;
            let result = await ctx.service.dataSource.sourceConfig.getDataByConfig({_id: config_id, params: {body: request.body, query: request.query, headers: request.headers}});
            ctx.body = result;
        } catch (e) {
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }

    }

    async getApiConfiguredQuery(){
        const { ctx, logger } = this;
        try {
            const {app_id} = ctx.query;
            let {list} = await ctx.service.dataSource.sourceConfig.getApiConfiguredQuery({app_id});
            ctx.body = {list};
        } catch (e) {
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async constructSelectedSchema(){
        const { ctx, logger, app: {_} } = this;
        ctx.helper.validate(Rules.constructSelectedSchemaRule);
        logger.info(new Date());
        try {
            const {
                request:{
                    body:{
                        app_id,
                        sourceName,
                        preAddSchemas
                    }
                }
            } = ctx;

            let schemas = [];
            for(let preAddSchema of preAddSchemas){
                let {structure, source_id} = await ctx.service.dataSource.sourceConfig
                .getStructure({app_id, sourceName, collectionName:preAddSchema});
                let customizeModel = await ctx.service.dataSource.sourceConfig
                .addCustomizeModel({source_id, collectionName:preAddSchema, schema:structure});
                schemas.push(customizeModel);
            }

            ctx.body = {
                result: true,
                schemas
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async autoConstructSchema(){
        const { ctx, logger, app: {_} } = this;
        ctx.helper.validate(Rules.autoConstructSchemaRule);

        try {
            const {
                request:{
                    body:{
                        app_id,
                        sourceName
                    }
                }
            } = ctx;

            let {tables} = await ctx.service.dataSource.sourceConfig
            .getTables({app_id, sourceName});

            let {source_id, existSchemas} = await ctx.service.dataSource.sourceConfig
            .fetchExistSchema({app_id, sourceName});

            let preAddSchemas = _.pullAll(tables, existSchemas);

            let schemas = [];
            for(let preAddSchema of preAddSchemas){
                let {structure} = await ctx.service.dataSource.sourceConfig
                .getStructure({app_id, sourceName, collectionName:preAddSchema});

                let customizeModel = await ctx.service.dataSource.sourceConfig
                .addCustomizeModel({source_id, collectionName:preAddSchema, schema:structure});

                schemas.push(customizeModel);
            }

            ctx.body = {
                result: true,
                source_id,
                schemas
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    };

    async test(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.testRule);

        try{

            const {
                request:{
                    body:{
                        source_id
                    }
                }
            } = ctx;

            let { result } = await ctx.service.dataSource.sourceConfig
            .test({source_id});

            ctx.body = {
                result: true,
                connected: result
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }

    };

    async analyseData(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.analyseDataRule);

        try{

            const {source_id, model_id} = ctx.query;

            let invalidData = await ctx.service.dataSource.dataAnalyse
            .analyseCollection({source_id, model_id});

            ctx.body = {
                result: true,
                data: invalidData
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async postQueryConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.postQueryConfigRule);

        try{

            const {name, collection_name, operation, query, extra_operation, source_oid, app_oid, collection_oid, params_example} = ctx.request.body;

            let data = await ctx.service.dataSource.sourceConfig
            .saveQueryConfig({name, collection_name, operation, query, extra_operation, source_oid, app_oid, collection_oid, params_example});

            ctx.body = {
                result: true,
                data
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async getQueryConfigData(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getQueryConfigDataRule);


        try{

            let {source_oid, page, pageSize, collection_name, name, collection_oid} = ctx.request.query;
            page = Number(page) || 0;
            pageSize = Number(pageSize) || 15;

            let data = await ctx.service.dataSource.sourceConfig
            .getQueryConfigDataBySource({source_oid, page, pageSize, collection_name, name, collection_oid});

            ctx.body = {
                result: true,
                data
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async getQueryConfigById() {
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getQueryConfigByIdRule);
        try {
            let data = await ctx.service.dataSource.sourceConfig.getQueryConfigById(ctx.request.query._id);
            if (!data || !data._id) {
                ctx.body = {
                    result: false,
                    message: '未查询到数据'
                }
            } else {
                ctx.body = {
                    result: true,
                    data: data
                }
            }
        } catch (e) {
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async deleteQueryConfigData(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.deleteQueryConfigDataRule);

        try{

            const {queryconfig_id} = ctx.request.body;

            let data = await ctx.service.dataSource.sourceConfig
            .deleteOneQueryConfigData({queryconfig_id});

            ctx.body = {
                result: true,
                data
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async updateQueryConfig(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.updateQueryConfigRule);

        try{
            const {queryconfig_id, name, collection_name, operation, query, extra_operation, params_example } = ctx.request.body;

            let data = await ctx.service.dataSource.sourceConfig
            .updateQueryConfigData({queryconfig_id, name, collection_name, operation, query, extra_operation, params_example});

            ctx.body = {
                result: true,
                data
            }
        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async getModelSchemaDetail(){
        const { ctx, logger } = this;
        ctx.helper.validate(Rules.getModelSchemaDetailRule);

        try{

            const {collection_oid} = ctx.request.query

            let data = await ctx.service.dataSource.sourceConfig
            .getModelSchemaData({collection_oid})

            ctx.body = {
                result: true,
                data
            }

        }catch(e){
            logger.error(e);
            ctx.body = {
                result: false,
                message: e.message
            }
        }
    }

    async getDocMap() {
        const { ctx } = this;

        const {
            SOURCE_DATA_FORM_DATA_FROM_MAP,
            SOURCE_DATA_SYSTEM_METHOD_MAP,
            CRYPTO_METHOD_MAP,
            KEYEVAL_ELEMENT_MAP,
            ENCODE_MAP,
            SIGNPOSITION_MAP,
            DATA_TYPE_MAP,
            PROTOCAL_MAP,
            CONTENT_TYPE_MAP,
            CONVERT_TEXT_MAP,
            DESENSITIZATION_MAP,
            HASH_METHOD_MAP,
            SOURCE_EXTRA_OPERATION_MAP
        } = require('../../const/module/consult');

        ctx.body = {
            result: true,
            from: SOURCE_DATA_FORM_DATA_FROM_MAP,
            system: SOURCE_DATA_SYSTEM_METHOD_MAP,
            contentType: CONTENT_TYPE_MAP,
            hash: HASH_METHOD_MAP,
            encode: ENCODE_MAP,
            crypto: CRYPTO_METHOD_MAP,
            signPosition: SIGNPOSITION_MAP,
            dataType: DATA_TYPE_MAP,
            protocal: PROTOCAL_MAP,
            convertText: CONVERT_TEXT_MAP,
            elements: KEYEVAL_ELEMENT_MAP,
            desensitization: DESENSITIZATION_MAP,
            extraOperation: SOURCE_EXTRA_OPERATION_MAP
        }
    }

    async queryLog() {
        const { ctx } = this;
        let { page, pageSize, queryConfig_id, status } = ctx.request.body;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;
        let result = await ctx.service.dataSource.sourceConfig.getQueryLog({page, pageSize, queryConfig_id, status});
        ctx.body = {
            result: true,
            data: result
        };
    }
}

module.exports = sourceController;
