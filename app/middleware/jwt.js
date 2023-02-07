'use strict';

module.exports = (options, app) => {
    return async function (ctx, next) {
        let verified = false;
        const token = ctx.request.header['b-json-web-token'];
        //远程调用相关，以redis为例
        const {helper, model} = ctx;
        let result = helper.verifyJWT(token);
        if(result.result){
            //校验成功，将用户信息写入request
            if(result.decoded && result.decoded.user_id){
                //管理端登录
                const consultUserObj = await model.ConsultUser
                .findById(result.decoded.user_id)
                .populate(`role_oid`)
                .select(`username role_oid`)
                .lean();

                //企业微信登录
                const  userObj = await model.User
                .findById(result.decoded.user_id)
                .select('nickname')
                .lean();
                console.log('进入到jwt校验')
                if(consultUserObj){
                    consultUserObj.role = consultUserObj.role_oid.name;
                    consultUserObj.access = consultUserObj.role_oid.access;
                    consultUserObj.isAdmin = consultUserObj.role_oid.isAdmin;
                    if(!consultUserObj.isAdmin){
                        let userScope = await model.ConsultUserScope.findOne({
                            user_oid: consultUserObj._id
                        })
                        if(userScope){
                            consultUserObj.scope = userScope.scope
                        }
                    }
                    delete consultUserObj.role_oid;
                    ctx.request.userInfo = consultUserObj;
                    verified = true;
                } else if(userObj){
                    ctx.request.userInfo = userObj;
                    verified = true;
                } else {
                    result.message = 
                    `用户不存在或已被系统删除, id: ${result.decoded.user_id}`;
                }
            }else{
                result.message = "jwt验证信息有误"
            }
        } else {
            //校验失败
            result.message = "jwt验证失败"
        }

        if(verified){
            await next();
        }else{
            ctx.status = 200;
            ctx.body = {
                result: false,
                code: "401",
                message: "token校验失败或token已过期，请重新获取。"
            };
        }
    };
};
