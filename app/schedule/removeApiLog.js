const Subscription = require('egg').Subscription;
class syncPrivateStructClass extends Subscription {
    constructor(ctx) {
        super(ctx);
    }
    // 通过 schedule 属性来设置定时任务的执行间隔等配置
    static get schedule() {
        return {
            // interval: '1m', // 使用间隔时间表达，1 分钟间隔
            cron: '0 0 */1 * * *',//使用cron表达，每小时进行相应的更新
            type: 'worker', // 只有一条worker去执行
            immediate: true,
            env: ["prod"]
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        //run server
        const {ctx:{service, logger}} = this;

        logger.info('删除超时1个月的接口日志');

        await service.apilog.apilogRotate.clearExpireApiLog(1);

        return
    }
}

module.exports = syncPrivateStructClass;