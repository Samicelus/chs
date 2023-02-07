const fs = require('fs');
const EGG_SERVER_ENV = process.env.EGG_SERVER_ENV;

module.exports = (app, tableName) => {

    let schemaRef = require('../../const/schemaRef/schemaRef.default.js')

    let stat = false;

    try {
        stat = fs.statSync(`./const/schemaRef/schemaRef.${EGG_SERVER_ENV}.js`, {
            throwIfNoEntry: false
        })
    }catch(e){
        console.log(`./const/schemaRef/schemaRef.${EGG_SERVER_ENV}.js do not exist, use default schemaRef...`)
    }
    
    if(stat){
        schemaRef = require(`../../const/schemaRef/schemaRef.${EGG_SERVER_ENV}.js`)
    }

    return  app.mongooseDB.get(schemaRef[tableName] || 'huaxi');
}