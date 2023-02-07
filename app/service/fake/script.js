"use strict";

// app/service/user.js
const Service = require("egg").Service;

class ScriptService extends Service {
  async countMessage() {
    const {
      ctx: { model },
    } = this;
    const count = await model.CommunicationReply.count({
      image: { $regex: "runningdoctor" },
      created: { $gt: "2021-02-01" },
    });
    const example = await model.CommunicationReply.findOne({
      image: { $regex: "runningdoctor" },
    });
    return { count, example };
  }

  async updateMessage() {
    const {
      ctx: { model },
    } = this;
    const list = await model.CommunicationReply.find({
      created: { $gt: "2021-02-01" },
    });
    for (let item of list) {
      await item.save();
    }
    return list;
  }
}

module.exports = ScriptService;
