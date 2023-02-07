'use strict';

// app/service/user.js
const Service = require('egg').Service;

class FooService extends Service {
    async incrAndReturn(id) {
        await this.ctx.model.Foo.update({ id }, { $inc: { count: 1 } }, { upsert: true });
        return (await this.ctx.model.Foo.findOne({ id })).count;
    }

    async buildAndParseXml(data){
        const {ctx: { model, helper }, logger} = this;
        logger.info(data);
        let xml = helper.buildXml({data});
        logger.info(xml);
        let parsed = await helper.parseXml({str: xml});
        logger.info(parsed);
        return true;
    }
    
    async redisDemo()
    {
        /**
         * redis使用例子
         * await this.app.redis[command];
         */
        const str = await this.app.redis.get("redis");
        //redis事务-test
        await this.app.redis.multi().set('foo', 'bar').get('foo').exec(function (err, results) {
            // results === [[null, 'OK'], [null, 'bar']]
        })
        return str;
    }
}

module.exports = FooService;
