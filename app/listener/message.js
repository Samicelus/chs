const { Listener } = require('egg-bus');
 
class Message extends Listener {
  static get watch() {
    return [ 'messageSaved', 'recordRenewed']; // 监听的事件名称
  }
 
  static get queue() {
    return 'messages'; // 使用的队列名称
  }
 
  static get attempts() {
    return 5; // 重试次数
  }
 
  /**
   * listener 任务运行时调用
   * 通过 this.ctx 和 this.app 分别获取 egg 的 Context 和 Application 对象
   * @param {Object} event 包含name-事件名称,data-事件数据 
   * @param {Object} job Bull 的原始 Job 对象
   */
  async run(event, job) {
    //console.log(event.name, event.data);
    const {ctx, app} = this;
    switch(event.name){
        case "messageSaved":
            if(event.data.from === "patient"){
                await ctx.service.module.message.afterSavePatientMessage({
                    message: event.data
                });
            }
            if(event.data.from === "doctor"){
                await ctx.service.module.message.afterSaveDoctorMessage();
            }
            if(event.data.from === "system"){
                await ctx.service.module.message.afterSaveSystemMessage(); 
            }
            break;
        case "recordRenewed":
            let messageObj = await ctx.service.module.message.saveRecordAlert();
            app.bus.emit('messageSaved', messageObj);
            break;
        default:
            break;
    }
  }
 
  /**
   * 当 listener 失败并重试达到限定次数后调用
   * @param {Object} event 包含name-事件名称,data-事件数据
   * @param {Error} error Error对象
   * @param {Object} job Bull 的原始 Job 对象
   */
  async failed(event, error, job) {
    console.log(event.name, event.data);
    console.error(error);
    const {ctx, app} = this;
    switch(event.name){
        case "messageSaved":
            await ctx.service.module.message
            .updateMessageStatus(event.data._id, 'fail');
            break;
        case "recordRenewed":
            break;
        default:
            break;
    }
  }
}
 
module.exports = Message;