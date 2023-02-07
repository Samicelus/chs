/**
 * 医互通日活统计
 */
const moment = require('moment');
moment.locales('zh-cn');
const _ = require('lodash');
const Service = require('egg').Service;
const {TYPE_MAP, SUBTYPE_MAP} = require('../../../const/module/rdApp');
const { TableFloatProperties } = require('docx');
class AccessStatService extends Service {

    /**
     * 访问人数, 访问率, 自建流程发起量
     * @param {date} 日期 
     * @param {company_id} 
     */
    async companyDailyData({date, company_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let timeFormat = "";
        if(date){
            timeFormat = new moment(date).format('YYYY-MM-DD');
        }else{
            timeFormat = new moment().format('YYYY-MM-DD');
        }

        let accessCountObj = await model.ActivityStat.findOne({
            "time.format": timeFormat,
            company_id
        });

        let accessCount = 0;

        if(accessCountObj) {
            accessCount = accessCountObj.count;
        }

        let userCount = await model.CompanyUser.count({
            company_id
        });

        userCount += (await model.PrivateCompanyUser.count({company_id}));

        let condition = {
            created: {"$gte": moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss'), "$lte": moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss')},
            company_id
        }

        let iflowCount = await model.Iflow.count(condition);

        iflowCount += (await model.PrivateIflow.count(condition));

        return {
            accessCount,
            userCount,
            iflowCount
        }
    }
    
    async appAccess({startDate, endDate, company_id}){
        const {ctx: {model, helper, logger}, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        if(!startDate && !endDate){
            startDate = new moment().startOf('week')
            endDate = new moment().endOf('week')
        }

        let condition = {
            "time.format": {
                "$gte": moment(startDate).format('YYYY-MM-DD'),
                "$lte": moment(endDate).format('YYYY-MM-DD')
            }
        }

        if(company_id){
            condition.company_id = company_id
        }else{
            condition.company_id = {
                "$exists": false
            }
        }

        let accessData = await model.AccessStat.find(condition).sort({"time.format":1}).lean();

        let appAccess = {}
        let userAccess = {}
        let dateCount = 1
        let appList = []
        let appListMap = {}
        let userList = []
        let userListMap = {}
        let groupMap = {}

        if(Array.isArray(accessData) && accessData.length){
            appAccess = _.reduce(
                accessData.map(item=>item.appAccess),
                function(total, current){
                    return _.mergeWith(total, current, sumMerger)
                },
                appAccess
            )
            userAccess = _.reduce(
                accessData.map(item=>item.userAccess),
                function(total, current){
                    return _.mergeWith(total, current, sumMerger)
                },
                userAccess
            )
            dateCount = accessData.length

            let app_ids = Object.keys(appAccess).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)});
            let user_ids = Object.keys(userAccess).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)});

            let apps = await model.SmartApp.find({"_id":{"$in":app_ids.map(item=>ObjectId(item))}}).select('name type subtype').lean();

            let privateApps = await model.PrivateSmartApp.find({"_id":{"$in":app_ids.map(item=>ObjectId(item))}}).select('name type subtype').lean();

            apps = apps.concat(privateApps);

            let users = await model.User.find({"_id":{"$in":user_ids.map(item=>ObjectId(item))}}).select('nickname').lean();

            let privateUser = await model.PrivateUser.find({"_id":{"$in":user_ids.map(item=>ObjectId(item))}}).select('nickname').lean();

            users = users.concat(privateUser);

            let groupUserCondition = {
                user_id: {
                    "$in": user_ids
                },
                is_temp: {
                    "$exists": false
                }
            }

            if(company_id){
                groupUserCondition.company_id = company_id
            }

            let groupUsers = await model.GroupUser.find(groupUserCondition).select('group_id user_id').lean();

            let privateGroupUser = await model.PrivateGroupUser.find(groupUserCondition).select('group_id user_id').lean();

            groupUsers = groupUsers.concat(privateGroupUser);

            let group_ids = [];

            groupUsers.forEach((groupUser)=>{
                if(!groupMap[groupUser.group_id]){
                    groupMap[groupUser.group_id] = {
                        user_ids:[]
                    }
                    group_ids.push(groupUser.group_id)
                }
                groupMap[groupUser.group_id].user_ids.push(groupUser.user_id)
            })

            let groups = await model.Group.find({"_id": {"$in": group_ids.map(item=>ObjectId(item))}}).select('group_name').lean()

            let privateGroups = await model.PrivateGroup.find({"_id": {"$in": group_ids.map(item=>ObjectId(item))}}).select('group_name').lean()

            groups = groups.concat(privateGroups);

            groups.forEach((group)=>{
                if(groupMap[group._id]){
                    groupMap[group._id].group_name = group.group_name
                }
            })

            let groupUserMap = {}

            for(let group_id in groupMap){
                let group_name = groupMap[group_id].group_name;
                for(let user_id of groupMap[group_id].user_ids){
                    groupUserMap[user_id] = group_name
                }
            }

            let appMap = {}
            let userMap = {}

            apps.forEach(item=>{
                appMap[item._id.toString()] = SUBTYPE_MAP[item.subtype] || TYPE_MAP[item.type]
            })

            users.forEach(item=>{
                userMap[item._id.toString()] = item.nickname
            })

            for(let app_id in appAccess){
                let appType = appMap[app_id]
                if(appType){
                    if(!appListMap[appType]){
                        appListMap[appType] = {
                            name: appType,
                            childrenMap: {}
                        }
                    }
                    for(let user_id in appAccess[app_id]){
                        let group_name = groupUserMap[user_id]
                        if(!appListMap[appType].childrenMap[group_name]){
                            appListMap[appType].childrenMap[group_name] = {
                                name: group_name,
                                value: 0
                            }
                        }
                        appListMap[appType].childrenMap[group_name].value += appAccess[app_id][user_id]
                    }
                }
            }

            for(let appType in appListMap){
                let appTypeData = {
                    name: appListMap[appType].name,
                    type: 'app',
                    children: []
                }
                for(let group_name in appListMap[appType].childrenMap){
                    appTypeData.children.push({
                        name: appListMap[appType].childrenMap[group_name].name,
                        type: 'group',
                        value: appListMap[appType].childrenMap[group_name].value
                    })
                }
                appList.push(appTypeData)
            }

            for(let user_id in userAccess){
                let group_name = groupUserMap[user_id]
                if(!userListMap[group_name]){
                    userListMap[group_name] = {
                        name: group_name,
                        type: 'group',
                        childrenMap: {},
                        children: []
                    }
                }
                
                for(let app_id in userAccess[user_id]){
                    let appType = appMap[app_id]
                    if(!userListMap[group_name].childrenMap[appType]){
                        userListMap[group_name].childrenMap[appType] = {
                            name: appType,
                            value: 0
                        }
                    }
                    userListMap[group_name].childrenMap[appType].value += userAccess[user_id][app_id]
                }
            }

            for(let group_name in userListMap){
                for(let appType in userListMap[group_name].childrenMap){
                    userListMap[group_name].children.push({
                        name: userListMap[group_name].childrenMap[appType].name,
                        value: userListMap[group_name].childrenMap[appType].value,
                        type: 'app',
                    })
                }
                delete userListMap[group_name].childrenMap
                userList.push(userListMap[group_name])
            }
        }

        return {
            appList,
            userList,
            dateCount
        }
    }

    async userRank({startDate, endDate, company_id}){
        const {ctx: {model, helper, logger}, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        if(!startDate && !endDate){
            startDate = new moment().startOf('week')
            endDate = new moment().endOf('week')
        }

        let condition = {
            "time.format": {
                "$gte": moment(startDate).format('YYYY-MM-DD'),
                "$lte": moment(endDate).format('YYYY-MM-DD')
            }
        }

        if(company_id){
            condition.company_id = company_id
        }else{
            condition.company_id = {
                "$exists": false
            }
        }

        let accessData = await model.AccessStat.find(condition).sort({"time.format":1}).lean();

        let userAccess = {}
        let appAccess = {}
        let userList = []
        let dateCount = 1

        if(Array.isArray(accessData) && accessData.length){
            appAccess = _.reduce(
                accessData.map(item=>item.appAccess),
                function(total, current){
                    return _.mergeWith(total, current, sumMerger)
                },
                appAccess
            )
            userAccess = _.reduce(
                accessData.map(item=>item.userAccess),
                function(total, current){
                    return _.mergeWith(total, sumSecondKey(current), sumMerger)
                },
                userAccess
            )

            dateCount = accessData.length;

            let user_ids = Object.keys(userAccess).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)});
            let app_ids = Object.keys(appAccess).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)});

            let apps = await model.SmartApp.find({"_id":{"$in":app_ids.map(item=>ObjectId(item))}}).select('name type subtype').lean();

            let privateApps = await model.PrivateSmartApp.find({"_id":{"$in":app_ids.map(item=>ObjectId(item))}}).select('name type subtype').lean();

            apps = apps.concat(privateApps);

            let users = await model.User.find({"_id":{"$in":user_ids.map(item=>ObjectId(item))}}).select('nickname').lean();

            let privateUsers = await model.PrivateUser.find({"_id":{"$in":user_ids.map(item=>ObjectId(item))}}).select('nickname').lean();

            users = users.concat(privateUsers);

            let userMap = {}
            let appMap = {}

            apps.forEach(item=>{
                appMap[item._id.toString()] = SUBTYPE_MAP[item.subtype] || TYPE_MAP[item.type]
            })
            users.forEach(item=>{
                userMap[item._id.toString()] = item.nickname
            })

            for(let user_id in userAccess){
                let userInfo = {
                    type: 'user',
                    name: userMap[user_id],
                    access: userAccess[user_id].access,
                    value: userAccess[user_id].value,
                    user_id
                }
                if(userInfo.access){
                    userInfo.appList = [];
                    let userAppListMap = {}
                    for(let app_id in userInfo.access){
                        let app_name = appMap[app_id]
                        if(app_name){
                            if(!userAppListMap[app_name]){
                                userAppListMap[app_name] = {
                                    app_name,
                                    value: 0
                                }
                            }
                            userAppListMap[app_name].value += userInfo.access[app_id]
                        }
                    }
                    for(let app_name in userAppListMap){
                        userInfo.appList.push(userAppListMap[app_name])
                    }
                    delete userInfo.access
                }
                userList.push(userInfo)
            }


        }

        return {
            userList: _.sortBy(userList, 'value').reverse(),
            dateCount
        }
    }

    async groupRank({startDate, endDate, company_id}){
        const {ctx: {model, helper, logger}, app: {mongoose: {Types: { ObjectId }}}} = this;
        
        if(!startDate && !endDate){
            startDate = new moment().startOf('week')
            endDate = new moment().endOf('week')
        }

        let condition = {
            "time.format": {
                "$gte": moment(startDate).format('YYYY-MM-DD'),
                "$lte": moment(endDate).format('YYYY-MM-DD')
            }
        }

        if(company_id){
            condition.company_id = company_id
        }else{
            condition.company_id = {
                "$exists": false
            }
        }

        let accessData = await model.AccessStat.find(condition).sort({"time.format":1}).lean();

        let userAccess = {}
        let appAccess = {}
        let groupList = []
        let groupListMap = {}
        let dateCount = 1
        let groupMap = {}

        if(Array.isArray(accessData) && accessData.length){
            appAccess = _.reduce(
                accessData.map(item=>item.appAccess),
                function(total, current){
                    return _.mergeWith(total, current, sumMerger)
                },
                appAccess
            )
            userAccess = _.reduce(
                accessData.map(item=>item.userAccess),
                function(total, current){
                    return _.mergeWith(total, sumSecondKey(current), sumMerger)
                },
                userAccess
            )

            dateCount = accessData.length;

            let user_ids = Object.keys(userAccess).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)});
            let app_ids = Object.keys(appAccess).filter((item)=>{return /^[a-f0-9]{24,24}$/.test(item)});

            let apps = await model.SmartApp.find({"_id":{"$in":app_ids.map(item=>ObjectId(item))}}).select('name type subtype').lean();

            let privateApps = await model.PrivateSmartApp.find({"_id":{"$in":app_ids.map(item=>ObjectId(item))}}).select('name type subtype').lean();

            apps = apps.concat(privateApps);

            let users = await model.User.find({"_id":{"$in":user_ids.map(item=>ObjectId(item))}}).select('nickname').lean();

            let privateUsers = await model.PrivateUser.find({"_id":{"$in":user_ids.map(item=>ObjectId(item))}}).select('nickname').lean();

            users = users.concat(privateUsers)

            let groupUserCondition = {
                user_id: {
                    "$in": user_ids
                },
                is_temp: {
                    "$exists": false
                }
            }

            if(company_id){
                groupUserCondition.company_id = company_id
            }

            let groupUsers = await model.GroupUser.find(groupUserCondition).select('group_id user_id').lean();

            let privateGroupUsers = await model.PrivateGroupUser.find(groupUserCondition).select('group_id user_id').lean();

            groupUsers = groupUsers.concat(privateGroupUsers);

            let group_ids = [];

            groupUsers.forEach((groupUser)=>{
                if(!groupMap[groupUser.group_id]){
                    groupMap[groupUser.group_id] = {
                        user_ids:[]
                    }
                    group_ids.push(groupUser.group_id)
                }
                groupMap[groupUser.group_id].user_ids.push(groupUser.user_id)
            })

            let groups = await model.Group.find({"_id": {"$in": group_ids.map(item=>ObjectId(item))}}).select('group_name').lean();

            let privateGroups = await model.PrivateGroup.find({"_id": {"$in": group_ids.map(item=>ObjectId(item))}}).select('group_name').lean();

            groups = groups.concat(privateGroups);

            groups.forEach((group)=>{
                if(groupMap[group._id]){
                    groupMap[group._id].group_name = group.group_name
                }
            })

            let groupUserMap = {}

            for(let group_id in groupMap){
                let group_name = groupMap[group_id].group_name;
                for(let user_id of groupMap[group_id].user_ids){
                    groupUserMap[user_id] = group_name
                }
            }

            let userMap = {}
            let appMap = {}

            apps.forEach(item=>{
                appMap[item._id.toString()] = SUBTYPE_MAP[item.subtype] || TYPE_MAP[item.type]
            })
            users.forEach(item=>{
                userMap[item._id.toString()] = item.nickname
            })

            for(let user_id in userAccess){
                let group_name = groupUserMap[user_id]
                if(group_name){
                    if(!groupListMap[group_name]){
                        groupListMap[group_name] = {
                            type: 'group',
                            name: group_name,
                            access: {},
                            value: 0
                        }
                    }
                    groupListMap[group_name].access = _.mergeWith(userAccess[user_id].access, groupListMap[group_name].access, sumMerger)
                    groupListMap[group_name].value += userAccess[user_id].value
                }
            }
            for(let group_name in groupListMap){
                if(groupListMap[group_name].access){
                    groupListMap[group_name].appList = [];
                    let userAppListMap = {}
                    for(let app_id in groupListMap[group_name].access){
                        let app_name = appMap[app_id]
                        if(app_name){
                            if(!userAppListMap[app_name]){
                                userAppListMap[app_name] = {
                                    app_name,
                                    value: 0
                                }
                            }
                            userAppListMap[app_name].value += groupListMap[group_name].access[app_id]
                        }
                    }
                    for(let app_name in userAppListMap){
                        groupListMap[group_name].appList.push(userAppListMap[app_name])
                    }
                }
                groupList.push(groupListMap[group_name])
            }

        }

        return {
            groupList: _.sortBy(groupList, 'value').reverse(),
            dateCount
        }
    }

    async showUserInfo({user_id, company_id}){
        const {ctx: {model, helper}, logger, app: {mongoose: {Types: { ObjectId }}}} = this;

        let userInfo = {}

        let groupUser = await model.GroupUser.findOne({
            company_id,
            user_id
        }).lean();

        if(!groupUser){
            groupUser = await model.PrivateGroupUser.findOne({
                company_id,
                user_id
            }).lean();
        }

        if(groupUser){
            let group_id = groupUser.group_id;
            let group = await model.Group.findById(group_id).lean()
            if(!group){
                group = await model.PrivateGroup.findById(group_id).lean()
            }
            userInfo.group_name = group.group_name;
        }

        let companyUser = await model.CompanyUser.findOne({
            company_id,
            user_id
        }).lean()

        if(!companyUser){
            companyUser = await model.PrivateCompanyUser.findOne({
                company_id,
                user_id
            }).lean()
        }

        if(companyUser){
            userInfo.title = companyUser.title;
            userInfo.entryDate = companyUser.entryDate;
            userInfo.employee_id = companyUser.employee_id;
            let str = companyUser.phoneno;
            userInfo.phone = str.slice(0,3)+str.slice(3,-4).replace(/./g,"*")+str.slice(-4);
        }

        let user = await model.User.findById(user_id).lean();

        if(!user){
            user = await model.PrivateUser.findById(user_id).lean();
        }

        if(user){
            userInfo.last_login_date = user.last_login_date;
            userInfo.avatar = user.avatar;
        }

        return userInfo;
    }
}

function sumMerger(objValue, srcValue){
    if(typeof objValue == 'number' && typeof srcValue == 'number'){
        return objValue + srcValue;
    }
}

function sumSecondKey(obj){
    for(let childKey in obj){
        obj[childKey] = {
            value: _.reduce(obj[childKey], function(result, value){
                return result + value;
            }, 0),
            access: obj[childKey] 
        }
    }
    return obj
}

module.exports = AccessStatService;