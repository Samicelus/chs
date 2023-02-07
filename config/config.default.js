/* eslint valid-jsdoc: "off" */

"use strict";

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_1585626894600_7869";

  config.baseUrl = "http://127.0.0.1:7001/v1/public/";

  config.outUrl = "http://127.0.0.1:7001/v1/public/";

  config.omsUrl = "";

  // add your middleware config here
  config.middleware = ["params", "report", "jwt", "power", "module"];

  config.module = {
    enable: false,
  };

  config.power = {
    enable: false,
  };

  //jwt's middleware config seeting
  config.jwt = {
    enable: true,
    ignore: [
      `/v1/public/user/getToken`,
      `/v1/private/user/login`,
      `/v1/private/user/qywechat/login`,
      `/v0/communication/question/create`,
      `/v0/communication/doctor/search`,
      `/v0/communication/service/open`,
      `/v1/private/consultModulation/apiConfig/xlsx`,
      `/v1/private/consultModulation/apiConfig/doc`,
      `/v1/private/consultModulation/apiConfig/md`,
      `/v1/public/:callbackTag/:app_id/callback`,
      //`/v1/public/api/call`,
      `/v1/private/user/weixinQy/userInfo`,
      `/v1/public/IflowProcessTime`,
      `/v1/public/actuator/health`,
      `/v1/public/dailyData`,
      `/v1/public/dailyActivities`,
      `/v1/public/averageActivities`,
      `/v1/public/rdStat`,
      `/v1/public/activitiesRank`,
      `/v1/public/activitiesRankRate`,
      `/v1/public/iflowStat`,
      `/v1/public/companyIflows`,
      `/v1/public/iflowCreateStat`,
      `/v1/public/iflowCreateRank`,
      `/v1/public/companyDailyData`,
      `/v1/public/appAccess`,
      `/v1/public/userRank`,
      `/v1/public/groupRank`,
      `/v1/public/showUserInfo`,
      `/v1/public/foo/access`,
    ],
  };

  config.mongoose = {
    clients: {
      huaxi: {
        url: "mongodb://127.0.0.1/test",
        options: {
          autoIndex: true,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 500,
          poolSize: 10,
          bufferMaxEntries: 0,
        },
      },
      rd: {
        url: "mongodb://127.0.0.1/rd",
        options: {
          autoIndex: true,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 500,
          poolSize: 10,
          bufferMaxEntries: 0,
        },
      },
    },
  };

  //add the redis setting to the world
  config.redis = {
    client: {
      port: 6379, // Redis port
      host: "127.0.0.1", // Redis host
      password: null,
      db: 1,
    },
  };

  config.io = {
    init: {},
    namespace: {
      "/": {
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
    redis: {
      host: "127.0.0.1",
      port: 6379,
      auth_pass: null,
      db: 2,
    },
  };

  //default security setting
  config.security = {
    csrf: {
      enable: false,
      //ignoreJson:true
    },
    //domainWhiteList: [ 'http://192.168.102.180:8000' ]
  };

  //allow Cors
  config.cors = {
    //origin:'http://192.168.102.180:8000',
    origin: () => "*",
    credentials: true,
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
  };

  config.cos = {
    client: {},
    useAgent: true,
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  /**
   * 自定义错误码
   * error code define files
   */
  config.code = require("./errorcode");

  config.multipart = {
    mode: "file",
    fileExtensions: [".pdf", ".doc", ".docx"],
  };

  config.httpclient = {
    request: {
      // default timeout of request
      timeout: 5 * 60000,
    },
  };

  // 配置bodyParser，body接收xml
  config.bodyParser = {
    enable: true,
    encoding: "utf8",
    formLimit: "100kb",
    jsonLimit: "100kb",
    strict: true,
    queryString: {
      arrayLimit: 100,
      depth: 5,
      parameterLimit: 1000,
    },
    enableTypes: ["json", "form", "text"],
    extendTypes: {
      text: ["text/xml", "application/xml"],
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
