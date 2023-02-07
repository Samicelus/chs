'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');
let company;
let token;


describe('test/app/controller/consultModulation.test.js', () => {
    
    before(async function (){
        const ctx = app.mockContext();
        //清理名为'test'的应用
        await ctx.model.AppConfig.remove({
            name: 'test'
        });
        //新增一个用于测试的组织
        company = await ctx.model.Company({
            company_name: "testCompany"
        }).save();
        //新建一个用于测试的用户
        let role = await ctx.model.ConsultRole.findOne({}).lean();

        let user = await ctx.model.ConsultUser({
            role_oid: role._id,
            nickname: 'testUser',
            username: 'testUser'
        }).save();
        user.password = ctx.helper.computeHash('testUser', ctx.helper.generate16salt(user._id));
        await user.save();

        //获取jwt
        let response = await app.httpRequest()
        .post(`/v1/private/user/login`)
        .send({
            login: 'testUser',
            password: 'testUser'
        })
        token = response.body.token;
    })


    it('建立空应用', async () => {

        console.log(token)
        const result = await app.httpRequest()
        .post(`/v1/private/consultModulation/appConfig`)
        .set('b-json-web-token', token)
        .send({
            name: 'test',
            description: 'test',
            company_id: company._id.toString(),
            modules: [],
            status: [],
            api: []
        })
        .expect(200)
        .then(response =>{
            assert(response.body.result === true);
            assert(response.body.appConfig.name === 'test');
        })
    });

    after(async function (){
        const ctx = app.mockContext();
        //清理名为'test'的应用
        let app_oids = await ctx.model.AppConfig.distinct(
            "_id",
            {
            name: 'test'
            }
        );
        await ctx.model.ApiConfig.remove({"app_oid":{"$in":app_oids}});
        await ctx.model.ModuleConfig.remove({"app_oid":{"$in":app_oids}});
        await ctx.model.StatusConfig.remove({"app_oid":{"$in":app_oids}});
        await ctx.model.AppConfig.remove({
            name: 'test'
            });

        //清理测试的组织
        await ctx.model.Company.remove({
            company_name: "testCompany"
        });
        //清理测试用户
        await ctx.model.ConsultUser.remove({
            nickname: 'testUser'
        });
    })


})
