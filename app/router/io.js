'use strict';

module.exports = app => {
    const { io } = app;

    // version
    //使用egg-router-plus优化后的写法
    io.of('/').route('default', io.controller.default.index);
};