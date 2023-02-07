const {Job} = require('egg-bus');

class Sender extends Job {
    static get queue() {
        return 'messenger'
    }

    static get attempts() {
        return 5;
    }

    /**
     * job任务运行时调用，可通过this.ctx和this.app获取egg的ctx和app对象
     * @param {Object} data 事件发送过来的数据 
     * @param {Object} job Bull原始Job对象 
     */
    async run(data, job) {
    }

    /**
     * 当 job 失败并重试达到限定次数后调用
     * @param {Object} data 事件发送过来的数据 
     */
    failed(data) {
    }
}

module.exports = Sender;