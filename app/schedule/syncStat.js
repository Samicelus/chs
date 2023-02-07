const Subscription = require('egg').Subscription;
const {SYNC_COMPANY_MAP} = require('../../const/schedule/syncStruct');
class syncPrivateStructClass extends Subscription {
    constructor(ctx) {
        super(ctx);
    }
    // 通过 schedule 属性来设置定时任务的执行间隔等配置
    static get schedule() {
        return {
            // interval: '1m', // 使用间隔时间表达，1 分钟间隔
            cron: '0 */1 * * * *',//使用cron表达，每小时进行相应的更新
            type: 'worker', // 只有一条worker去执行
            immediate: true,
            env: ["api"]
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        //run server
        const {ctx:{service, logger}} = this;

        logger.info('从私有环境同步统计数据')

        let company_ids = Object.keys(SYNC_COMPANY_MAP)

        logger.info(SYNC_COMPANY_MAP)

        for(let company_id of company_ids){
            let result = await service.rdStat.sync.fetchStats({
                company_id
            })

            await service.rdStat.sync.syncStats(company_id, {
                ...result
            })
        }
        return
    }
}

module.exports = syncPrivateStructClass;