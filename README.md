# 模块化在线问诊

## 模块，行为，依赖 与 状态 的模型

我们将应用划分成各个模块(Module)，整个应用基于问诊单又拥有多种状态(Status)。
每个模块中有不同的行为(Action)，对应着用户--医生/患者对于问诊的各种操作
这些操作执行的前提是各种依赖(Dependency)-问诊单的一个或几个特定的状态

### Module 模块

我们将应用分为几个不同的模块，这种划分并不是绝对的，而是依据行为的逻辑关联性是否紧密，
将他们划归同一模块，比如：

|模块名称|包含行为|
|:------|:-------|
|咨询模块|新建咨询，医生发送聊天消息，患者发送聊天消息，关闭咨询，取消咨询|

可见，咨询模块包含的行为一起构成了轻问诊的基础流程，其操作都围绕着问诊单这一核心数据，
同理，我们可以划分一个病历模块:

|模块名称|包含行为|
|:------|:-------|
|病历模块|填写病历，审核病历|

这个模块包含了在问诊过程中，由于需要而填写并审核附上病历的一个子流程

### Action 行为

行为属于一个模块，描述的是用户围绕问诊单而发起的动作，
这些动作在问诊流程上可能会有前置条件。比如在一个在线问诊应用中，
医生关闭咨询的前提条件（Dependency依赖）是该问诊为有效问诊且咨询单在未关闭状态

|行为名称|依赖|
|:------|:-------|
|关闭咨询|有效问诊，咨询单未关闭|

### Dependency 依赖

每一个依赖即是一个状态的一个对应的值。一个行为可以有多个依赖，
当一个行为的所有依赖被满足以后，该行为便可以被执行，一旦有行为不被满足，
便会返回对应字符串给前端，以触发前端的用户交互。
一个依赖的数据结构如下：

```
{
    "statusName": String,       //状态名称
    "value": String,               //满足依赖的状态值
    "failStr": String           //当行为的该依赖不满足时，返回给操作者前端的字符串
}
```

### Status 状态

问诊单拥有多个状态，在问诊进行过程中，
这些状态不断变化，比如在一个场景中：
新建问诊后问诊单并不是一个有效问诊（有效问诊状态为否），
在医生给患者发送了三条聊天消息以后，该问诊单即变成了一个有效问诊（有效问诊状态为是）。
另外，在配置在线问诊状态时，我们建议尽量让一个状态中的各个状态值互斥
（保证一个状态值达成时，其他状态值的条件不达成）
状态的数据结构如下:

```
{
    "name": String,                         //状态名称
    "values": [                             //状态包含值枚举
        {
            "value": String,                //状态值
            "condition": {
                "conditionType": String,    //状态值判断方式
                "targetModel": String,      //当判断方式为hasDoc时,目标表名
                "min": Number,              //达成判断条件至少的数据条目数
                "extra": Object,            //额外判断条件
                "targetElement": String,    //当判断方式为keyEval时,目标数据
                "elementKey": String,       //目标数据的键名
                "elementEval": Any,         //目标数据的键值
                "service": String           //当判断方式为apiValidate,所用的api名
            }
        }
    ]
}
```

其中，每个状态值的是否达成的判断方式如下

|conditionType 判断方式名称|解释|
|:------|:-------|
|hasDoc|判断数据表中是否有满足条件的足够多的数据条目|
|keyEval|判断目标数据中某个键为特定值|
|apiValidate|根据调用api的返回结果判断|

完成状态和依赖的判断逻辑在 app/extend/helper.js 的 checkDependencies 方法中，
该方法被封装在了 app/middleware/module.js 中间件中。为了完成模块化在线问诊的逻辑，
因为一个行为对应了一个路由，开发过程重我们规定在路由层使用该中间件。使用方法如下:

```
//router/consult.js
...
    apiRouter.post(
        '/message/doctor/send',
        app.middleware.module({                 //调用中间件
            moduleKey: "consult",               //规定该行为所属的模块
            actionKey: "sendDoctorMessage"      //规定该行为的名称
        }),
        controller.consult.sendDoctorMessage
    );
...
```

## 事件总线

编写在线问诊逻辑时，不同服务之间的调用，我们采用事件总线来解耦。这里我们使用egg-bus插件

`npm i egg-bus --save`

### 启用插件

```bash
//plugin.js
...
    bus: {
        enable: true,
        package: 'egg-bus'
    },
...
```

### 插件配置

```bash
...
    config.bus = {
        debug: true,
        concurrency: 1,             //Bull队列处理的并发数
        listener: {
            ignore: null,           //忽略目录中的文件
            baseDir: 'listener',
            options: {              //Bull Job 配置
                attempts: 5,
                backoff: {
                    delay: 3000,
                    type: 'fixed'
                }
            }
        },
        job: {
            ignore: null,           //忽略目录中的文件
            baseDir: 'job',
            options: {              //Bull Job 配置
                attempts: 5,
                backoff: {
                    delay: 3000,
                    type: 'fixed'
                }
            }
        },
        bull: {
            redis: {
                host: 'localhost',
                port: 6379,
                db: 0
            }
        },
        queue: {
            default: 'default',     //默认队列名称
            prefix: 'bus'           //队列前缀
        },
        queues: {}
    };
...
```

### 事件总线目录结构

```bash
app
├── controller
│   ├── home.js
├── job        <-- 队列目录
│   └── somejob.ts
├── listener   <-- 事件监听目录
│   ├── somelistener.js
├── router.js

```

### 注册事件

我们在listener目录中编写要注册的事件监听，一个文件注册一个事件:

```bash
const { Listener } = require('egg-bus');
 
class Sender extends Listener {
  static get watch() {
    return [ 'messageSaved' ]; // 监听的事件名称
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
    console.log(event.name, event.data);
    const {ctx, app} = this;
    if(event.data.from === "patient"){
        await ctx.service.module.message.afterSavePatientMessage();
    }
    if(event.data.from === "doctor"){
        await ctx.service.module.message.afterSaveDoctorMessage();
    }
    event.data.sentStatus = 'sent';
    await event.data.save();
  }
 
  /**
   * 当 listener 失败并重试达到限定次数后调用
   * @param {Object} event 包含name-事件名称,data-事件数据
   * @param {*} error 
   * @param {Object} job Bull 的原始 Job 对象
   */
  async failed(event, error, job) {
    event.data.sentStatus = 'fail';
    await event.data.save();
  }
}
 
module.exports = Sender;
```

### 触发事件

```bash
...
app.bus.emit('someEvent', data);
...
```



```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org