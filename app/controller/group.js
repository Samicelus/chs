'use strict';
const stream = require('stream');
const Controller = require('egg').Controller;

// 定义controller所使用的参数校验规则
// helper里将ctx.validate方法调用封装了一下
// 新的 helper.validate方法接受的参数有3个选项:
// query, body, params 如果存在, 将对对应入参进行校验
// 这3个选项内具体配置方法参见 parameter 插件: https://github.com/node-modules/parameter
const Rules = {
    addApiGroupRule: {
        body: {
            groupName: {
                type: 'string'
            },
            pdfUrl: {
                type: 'object',
                required: false
            },
            wordUrl: {
                type: 'object',
                required: false
            }
        }
    },
    modifyApiGroupNameRule: {
        params: {
            group_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            groupName: {
                type: 'string'
            }
        }
    },
    modifyApiGroupDocsRule: {
        params: {
            group_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            pdfUrl: {
                type: 'object',
                required: false
            },
            wordUrl: {
                type: 'object',
                required: false
            }
        }
    },
    listApiGroupRule: {
        query: {
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
                type: 'string',
                required: false,
            },
            sortOrder: {
                type: 'enum',
                required: false,
                values: [ "ascend", "descend" ]
            }
        }
    },
    addItemToGroupRule: {
        body: {
            apiGroup_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            tag_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            itemName: {
                type: 'string',
                required: true
            }, 
            params: {
                type: 'object'
            },
            paramsExample: {
                type: 'object',
                required: false
            },
            returnConfig: {
                type: 'object'
            },
            returnExample: {
                type: 'object',
                required: false
            }
        }
    },
    getApiGroupItemsRule: {
        query: {
            apiGroup_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getItemDetailRule: {
        query: {
            apiGroupItem_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    updateItemRule: {
        params: {
            item_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            tag_id: {
                type: 'string',
                required: false,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            itemName: {
                type: 'string',
                required: false
            }, 
            params: {
                type: 'object',
                required: false
            },
            paramsExample: {
                type: 'object',
                required: false
            },
            returnConfig: {
                type: 'object',
                required: false
            },
            returnExample: {
                type: 'object',
                required: false
            }
        }
    },
    addTemplateRule: {
        body:{
            apiGroup_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            },
            templateName: {
                type: 'string',
                required: true
            },
            version: {
                type: 'string',
                required: true
            }
        }
    },
    spawnTemplateItemsRule: {
        body: {
            apiTemplate_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            apiGroup_id:{
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getApiTemplateItemsRule: {
        query: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getTemplateItemDetailRule: {
        query: {
            apiTemplateItem_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    createApiTemplateItemRule: {
        body: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            item: {
                type: 'object'
            }
        }
    },
    createApiTemplateCallbackItemRule: {
        body: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }, 
            item: {
                type: 'object'
            }
        }
    },
    updateApiTemplateItemRule: {
        params: {
            apiTemplateItem_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            item: {
                type: 'object'
            }
        }
    },
    searchApiRule: {
        query: {
            search: {
                type: 'string',
                required: false
            }
        }
    },
    replaceApiRule: {
        params: {
            apiTemplateItem_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        body: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    deleteApiTemplateItemRule: {
        params: {
            apiTemplateItem_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    deleteApiTemplateCallbackItemRule: {
        params: {
            apiTemplateCallbackItem_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportStandardDocRule: {
        query: {
            apiGroup_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    exportTemplateDocRule: {
        query: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getSerialVersionsRule: {
        query: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    changeVersionRule: {
        body: {
            version: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        },
        params: {
            apiTemplate_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getTestParamsRule: {
        query: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    },
    getTestReturnRule: {
        query: {
            api_id: {
                type: 'string',
                required: true,
                regex: /^[a-f0-9]{24,24}$/
            }
        }
    }
};

class GroupController extends Controller {
    async addApiGroup() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.addApiGroupRule);
            const {groupName, pdfUrl, wordUrl} = ctx.request.body;
            const apiGroup = await ctx.service.groupTag.group.addApiGroup({groupName, pdfUrl, wordUrl});
            ctx.body = {
                result: true,
                apiGroup
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    };

    async modifyApiGroupName() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.modifyApiGroupNameRule);
            const {group_id} = ctx.params;
            const {groupName} = ctx.request.body;
            const apiGroup = await ctx.service.groupTag.group.modifyApiGroupName({group_id, groupName});
            ctx.body = {
                result: true,
                apiGroup
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    };

    async modifyApiGroupDocs() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.modifyApiGroupDocsRule);
            const {group_id} = ctx.params;
            const {pdfUrl, wordUrl} = ctx.request.body;
            const apiGroup = await ctx.service.groupTag.group.modifyApiGroupDocs({group_id, pdfUrl, wordUrl});
            ctx.body = {
                result: true,
                apiGroup
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    };

    async listApiGroup() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.listApiGroupRule);
            const {search, page=1, pageSize=15, sortField, sortOrder} = ctx.query;
            const {list, count} = await ctx.service.groupTag.group.listApiGroup(
                {
                    search,
                    page,
                    pageSize,
                    sortField, 
                    sortOrder
                })
            ctx.body = {
                result: true,
                list, 
                count,
                page,
                pageSize
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async addItemToGroup() {
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.addItemToGroupRule);
            const {apiGroup_id, tag_id, itemName, params, paramsExample={}, returnConfig, returnExample={}} = ctx.request.body;
            const apiGroupItem = await ctx.service.groupTag.group.addItemToGroup(
                {
                    apiGroup_id, 
                    tag_id, 
                    itemName, 
                    params,
                    paramsExample, 
                    returnConfig,
                    returnExample
                });
            ctx.body = {
                result: true,
                apiGroupItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
    
    async getApiGroupItems(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.getApiGroupItemsRule);
            const {apiGroup_id} = ctx.query;
            const {list, groupName} = await ctx.service.groupTag.group.getApiGroupItems(
                {
                    apiGroup_id
                })
            ctx.body = {
                result: true,
                list,
                groupName
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async getItemDetail(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.getItemDetailRule);
            const {apiGroupItem_id} = ctx.query;
            const apiGroupItem = await ctx.service.groupTag.group.getItemDetail({apiGroupItem_id})
            ctx.body = {
                result: true,
                apiGroupItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
    
    async updateItem(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.updateItemRule);
            const {item_id} = ctx.params;
            const {tag_id, itemName, params, paramsExample, returnConfig, returnExample} = ctx.request.body;
            const apiGroupItem = await ctx.service.groupTag.group.updateItem(
                {
                    item_id, 
                    tag_id, 
                    itemName, 
                    params,
                    paramsExample, 
                    returnConfig,
                    returnExample
                });
            ctx.body = {
                result: true,
                apiGroupItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async addTemplate(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.addTemplateRule);
            const {apiGroup_id, templateName, version} = ctx.request.body;
            const apiTemplate = await ctx.service.groupTag.group.addTemplate(
                {
                    apiGroup_id, 
                    templateName,
                    version
                });
            ctx.body = {
                result: true,
                apiTemplate
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async spawnTemplateItems(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.spawnTemplateItemsRule);
            const {apiTemplate_id, apiGroup_id} = ctx.request.body;
            const result = await ctx.service.groupTag.group.spawnTemplateItems({
                apiTemplate_id, 
                apiGroup_id
            });
            ctx.body = {
                result
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async getApiTemplateItems(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.getApiTemplateItemsRule);
            const {apiTemplate_id} = ctx.query;
            const {list, callbackList} = await ctx.service.groupTag.group.getApiTemplateItems(
                {
                    apiTemplate_id
                })
            ctx.body = {
                result: true,
                list,
                callbackList
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async getTemplateItemDetail(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.getTemplateItemDetailRule);
            const {apiTemplateItem_id} = ctx.query;
            const apiTemplateItem = await ctx.service.groupTag.group.getTemplateItemDetail({apiTemplateItem_id})
            ctx.body = {
                result: true,
                apiTemplateItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async createApiTemplateItem(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.createApiTemplateItemRule);
            const {apiTemplate_id, item} = ctx.request.body;
            const apiTemplateItem = await ctx.service.groupTag.group.createApiTemplateItem({
                apiTemplate_id, 
                item
            })
            ctx.body = {
                result: true,
                apiTemplateItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async createApiTemplateCallbackItem(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.createApiTemplateCallbackItemRule);
            const {apiTemplate_id, item} = ctx.request.body;
            const apiTemplateCallbackItem = await ctx.service.groupTag.group.createApiTemplateCallbackItem({
                apiTemplate_id, 
                item
            })
            ctx.body = {
                result: true,
                apiTemplateCallbackItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async updateApiTemplateItem(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.updateApiTemplateItemRule);
            const {apiTemplateItem_id} = ctx.params;
            const {item} = ctx.request.body;
            const apiTemplateItem = await ctx.service.groupTag.group.updateApiTemplateItem({
                apiTemplateItem_id, 
                item
            })
            ctx.body = {
                result: true,
                apiTemplateItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async searchApi(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.searchApiRule);
            const {search} = ctx.query;
            const {list, apis} = await ctx.service.groupTag.group.searchApi({
                search
            })
            ctx.body = {
                result: true,
                list,
                apis
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async replaceApi(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.replaceApiRule);
            const {apiTemplateItem_id} = ctx.params;
            const {api_id} = ctx.request.body;
            const apiTemplateItem = await ctx.service.groupTag.group.replaceApi(
                {
                    apiTemplateItem_id, 
                    api_id
                }
            )
            ctx.body = {
                result: true,
                apiTemplateItem
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async deleteApiTemplateItem(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.deleteApiTemplateItemRule);
            const {apiTemplateItem_id} = ctx.params;
            const deleted = await ctx.service.groupTag.group.deleteApiTemplateItem(
                {
                    apiTemplateItem_id
                }
            )
            ctx.body = {
                result: true,
                deleted
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async deleteApiTemplateCallbackItem(){
        const { ctx, logger } = this;
        try {
            ctx.helper.validate(Rules.deleteApiTemplateCallbackItemRule);
            const {apiTemplateCallbackItem_id} = ctx.params;
            const deleted = await ctx.service.groupTag.group.deleteApiTemplateCallbackItem(
                {
                    apiTemplateCallbackItem_id
                }
            )
            ctx.body = {
                result: true,
                deleted
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async exportStandardDoc(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportStandardDocRule);
        const {data, name} = await ctx.service.groupTag.group.formStandardDoc({apiGroup_id:ctx.query.apiGroup_id});
        let fileStream = new stream.PassThrough();
        fileStream.end(data);
        ctx.attachment(`/${name}.docx`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = fileStream;
    }

    async exportTemplateDoc(){
        const {ctx} = this;
        ctx.helper.validate(Rules.exportTemplateDocRule);
        const {data, name} = await ctx.service.groupTag.group.formTemplateDoc({apiTemplate_id:ctx.query.apiTemplate_id});
        let fileStream = new stream.PassThrough();
        fileStream.end(data);
        ctx.attachment(`/${name}.docx`);
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.body = fileStream;
    }

    async getSerialVersions(){
        const {ctx, logger} = this;
        try {
            ctx.helper.validate(Rules.getSerialVersionsRule);
            const {apiTemplate_id} = ctx.query;
            const list = await ctx.service.groupTag.group.getSerialVersions(
                {
                    apiTemplate_id
                }
            )
            ctx.body = {
                result: true,
                list
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async changeVersion(){
        const {ctx, logger} = this;
        try {
            ctx.helper.validate(Rules.changeVersionRule);
            const {request:{body:{version}}, params:{apiTemplate_id}} = ctx;
            const apiTemplate = await ctx.service.groupTag.group.changeVersion(
                {
                    apiTemplate_id,
                    version
                }
            )
            ctx.body = {
                result: true,
                apiTemplate
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async getTestParams(){
        const {ctx, logger} = this;
        try {
            ctx.helper.validate(Rules.getTestParamsRule);
            const {api_id} = ctx.query;
            const testParams = await ctx.service.groupTag.tag.getTestParams(
                {
                    api_id
                }
            )
            ctx.body = {
                result: true,
                testParams
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }

    async getTestReturn(){
        const {ctx, logger} = this;
        try {
            ctx.helper.validate(Rules.getTestReturnRule);
            const {api_id} = ctx.query;
            const testReturn = await ctx.service.groupTag.tag.getTestReturn(
                {
                    api_id
                }
            )
            ctx.body = {
                result: true,
                testReturn
            }
        }catch(e){
            logger.error(e.message);
            ctx.body = {
                result: false,
                errorMessage: e.message
            }
        }
    }
}

module.exports = GroupController;
