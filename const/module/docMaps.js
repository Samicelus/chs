const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const maps = {}
const schemas = {};

function load_require(temp_path, cl){
    fs.readdirSync(temp_path).forEach(function(name){
        let info = fs.statSync(path.join(temp_path, name));
        if(info.isDirectory()){
            cl[name] = load_require(joinPath(temp_path, name), cl)
        }else{
            let ext = path.extname(name);
            let base = path.basename(name, ext);
            if (require.extensions[ext]) {
                cl[base] = require(path.join(temp_path, name));
            } else {
                console.log('cannot require '+name);
            }
        }
    })
}

let dirPath = path.resolve(path.join(__dirname, '../schema'));

load_require(dirPath, schemas);

parseSchemas(schemas, maps);

let result = {};

for(let modelName in maps){
    result[modelName] = [];
    for(let key in maps[modelName]){
        result[modelName].push({
            label: maps[modelName][key].name,
            value: key
        })
        if(maps[modelName][key].array){
            if(!result[modelName+'.'+key]){
                result[modelName+'.'+key] = []
            }
            for(let innerKey in maps[modelName][key].map){
                result[modelName+'.'+key].push({
                    label: maps[modelName][key].map[innerKey].name,
                    value: innerKey
                })
            }
        }
    }
}

function getFuncName(callee){
    if(Array.isArray(callee)){
        return "Array"
    }
    var _callee = callee.toString().replace(/[\s\?]*/g,""),
      comb = _callee.length >= 50 ? 50 :_callee.length;
      _callee = _callee.substring(0,comb);
      var name = _callee.match(/^function([^\(]+?)\(/);
      if(name && name[1]){
        return name[1];
    }
    var caller = callee.caller,
    _caller = caller.toString().replace(/[\s\?]*/g,"");
    var last = _caller.indexOf(_callee),
    str = _caller.substring(last-30,last);
    name = str.match(/var([^\=]+?)\=/);
    if(name && name[1]){
      return name[1];
    }
    return "anonymous"
}

function parseSchemas(schemas, maps){
    for(let schemaName in schemas){
        if(!maps[schemaName]){
            maps[schemaName] = {};
        }
        parseOneSchema(schemas, schemas[schemaName], maps[schemaName], []);
    }
}

function parseOneSchema(origin, schema, map, preKeys){
    for(let key in schema){
        //ignore the existing keys to avoid stack exceeding problem
        if (Array.isArray(preKeys) && preKeys.includes(key)) continue;
        let item = schema[key];
        if(item.mapName){
            map[preKeys.concat([key]).join('.')] = {
                name: item.mapName,
                array: false
            }
        }
        if(typeof item == 'object' && !Array.isArray(item)){
            parseOneSchema(origin, item, map, preKeys.concat([key]))
        }

        if(item.type && getFuncName(item.type) == 'ObjectID' && item.ref && origin[item.ref]){
            parseOneSchema(origin, origin[item.ref], map, preKeys.concat([key]))
        }

        if(Array.isArray(item) && typeof item[0] == 'object'){
            if(key === 'type'){
                let arrayMap = {};
                parseOneSchema(origin, item[0], arrayMap, []);
                if(!map[preKeys.join('.')]){
                    map[preKeys.join('.')] = {
                        name: item.mapName || preKeys.join('.'),
                        array: true,
                        map: arrayMap
                    };
                }else{
                    map[preKeys.join('.')].array = true;
                    map[preKeys.join('.')].map = arrayMap;
                }
                //取首个item情况
                let tempArr = _.clone(preKeys);
                tempArr.push(tempArr.pop()+'[0]');
                parseOneSchema(origin, item[0], map, tempArr);
            }else{
                let arrayMap = {};
                parseOneSchema(origin, item[0], arrayMap, []);
                map[preKeys.concat([key]).join('.')] = {
                    name: item.mapName || preKeys.concat([key]).join('.'),
                    array: true,
                    map: arrayMap
                };
                //取首个item情况
                parseOneSchema(origin, item[0], map, preKeys.concat([`${key}[0]`]))
            }
        }
    }
}

module.exports = result;