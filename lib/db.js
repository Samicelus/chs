const mongoose = require("mongoose");
const mysql = require("mysql");

// 存放链接池
let pool = {
  mongodb: {},
  mysql: {},
};

// mysql从连接池里获取连接
function getMysqlConnection(pool) {
  return new Promise(function (resolve, reject) {
    pool.getConnection(function (err, connection) {
      if (err) {
        // TODO 输出日志
        return reject(err);
      }
      resolve(connection);
    });
  });
}

// 连接
async function connect({ _id, dbType, connectStr, dbName, login, password }) {
  switch (dbType) {
    case "mongodb":
      let url = `mongodb://${
        login ? login + ":" + password + "@" : ""
      }${connectStr}${dbName ? "/" + dbName : ""}`;
      pool.mongodb[_id] = await mongoose.createConnection(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      break;
    case "mysql":
      let mysqlConfig = {
        host: connectStr.split(":")[0],
        port: connectStr.split(":")[1],
        user: login,
        password: password,
        database: dbName,
      };
      pool.mysql[_id] = mysql.createPool(mysqlConfig);
      break;
  }
}

// 获取连接
async function getConnect({
  _id,
  dbType,
  connectStr,
  dbName,
  login,
  password,
}) {
  switch (dbType) {
    case "mongodb":
      if (pool.mongodb[_id] && pool.mongodb[_id].readyState == "1") {
        // 已经连接上了的   直接用
        return pool.mongodb[_id];
      }
      await connect({ _id, dbType, connectStr, dbName, login, password });
      return pool.mongodb[_id];
    case "mysql":
      if (!pool.mysql[_id]) {
        // mysql 还没链接上的，先创建链接池
        await connect({ _id, dbType, connectStr, dbName, login, password });
      }
      return getMysqlConnection(pool.mysql[_id]);
  }
  return null;
}
exports.getConnect = getConnect;

// 断开连接
exports.breakConnect = async function ({ _id, dbType }) {
  if (pool[dbType][_id]) {
    switch (dbType) {
      case "mongodb":
        await pool[dbType][_id].close();
        break;
      case "mysql":
        await mysqlPoolClose(pool[dbType][_id]);
        break;
    }
    delete pool[dbType][_id];
  }
};

// mysql pool close
async function mysqlPoolClose(pool) {
  return new Promise(function (resolve, reject) {
    pool.end(function (err) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

// mysql query
async function mysqlQuery(conn, sql, param = []) {
  return new Promise(function (resolve, reject) {
    conn.query(sql, param, function (err, results, fields) {
      // 释放本次连接
      conn.release();
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
}
exports.mysqlQuery = mysqlQuery;

/***
 * 显示所有表
 */
exports.showTable = async function ({
  _id,
  dbType,
  connectStr,
  dbName,
  login,
  password,
}) {
  let tables;
  let conn = await getConnect({
    _id,
    dbType,
    connectStr,
    dbName,
    login,
    password,
  });
  switch (dbType) {
    case "mongodb":
      tables = (await conn.db.collections()).map(function (collection) {
        return collection.collectionName;
      });
      break;
    case "mysql":
      tables = await mysqlQuery(conn, "show tables", []);
      tables = tables.map((tableDesc) => {
        return tableDesc[`Tables_in_${dbName}`];
      });
      break;
  }
  return tables;
};

/***
 * 显示表结构
 */
exports.showModel = async function ({
  _id,
  dbType,
  connectStr,
  dbName,
  login,
  password,
  collectionName,
}) {
  let structure;
  let conn = await getConnect({
    _id,
    dbType,
    connectStr,
    dbName,
    login,
    password,
  });
  switch (dbType) {
    case "mongodb":
      let collection = await conn.db.collection(collectionName);
      structure = await new Promise((resolve, reject) => {
        collection.findOne({}, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(parseMongodbStructure(result));
          }
        });
      });
      break;
    case "mysql":
      structure = await mysqlQuery(conn, `desc ${collectionName}`, []);
      structure = parseMysqlStructure(structure);
      break;
  }
  return structure;
};

function convertMysqlType(Type) {
  if (
    /char/.test(Type) ||
    /blob/.test(Type) ||
    /text/.test(Type) ||
    /enum/.test(Type) ||
    /set/.test(Type)
  ) {
    return "String";
  } else if (
    /int/.test(Type) ||
    /float/.test(Type) ||
    /double/.test(Type) ||
    /decimal/.test(Type)
  ) {
    return "Number";
  } else if (/date/.test(Type) || /time/.test(Type) || /year/.test(Type)) {
    return "String";
  }
}

function parseMysqlStructure(structure) {
  let temp = {};
  for (let desc of structure) {
    temp[desc.Field] = {
      type: convertMysqlType(desc.Type),
    };
  }
  return temp;
}

function parseMongodbStructure(structure) {
  for (let key in structure) {
    if (
      key == "_id" ||
      (["object", "undefined"].includes(typeof structure[key]) &&
        !structure[key])
    ) {
      delete structure[key];
    } else {
      if (structure[key].constructor.name != "Object") {
        let type = structure[key].constructor.name;
        if (type == "ObjectID") {
          type = "ObjectId";
        }
        structure[key] = {
          type,
        };
      } else {
        structure[key] = parseMongodbStructure(structure[key]);
      }
    }
  }
  return structure;
}
