'use strict';

const Service = require('egg').Service;

class CosService extends Service {
    async putFile({name, filepath}) {
        const {ctx, logger} = this;

        let result;
        try{
            result = await ctx.cos.put(name, filepath);
        } finally {
            await ctx.cleanupRequestFiles();
        }

        let url;
        if(result){
            url =  `https://${result.Location}`
        }

        return {url};
    }
}

module.exports = CosService;
