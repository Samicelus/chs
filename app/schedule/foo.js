const Subscription = require('egg').Subscription;
class FooClass extends Subscription {
    constructor(ctx) {
        super(ctx);
    }
    // 通过 schedule 属性来设置定时任务的执行间隔等配置
    static get schedule() {
        return {
            // interval: '1m', // 使用间隔时间表达，1 分钟间隔
            cron: '0 */1 * * * *',//使用cron表达，每分钟进行相应的更新
            type: 'worker', // 只有一条worker去执行
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        //run server
        return
    }


}

module.exports = FooClass;