/**
 * 页面控制器方法的实现
 * 注意，方法名应与routrPage.js保持一致
 * 页面控制器方法的一般过程:
 * [1]从请求中取出参数，从session中取出已存入参数
 * [2]可用这些参数调用API，得到结果
 * [3]参数以及结果用于渲染动态页面，页面中包含被渲染变量<%=var%>
 * 下面设计没有第[2]步，原因是：
 * [1]采用页面内ajax调用来更新页面数据
 * [2]采用ejs带控制流的标签来书写页面元素比较复杂
 *
 */
var app_info = require('../config/server').app_info;

//登录页面
exports.renderLogin = function (req, res) {
    // console.log('1');
    res.render('login', {
        title: 'Login',
        messages: null,
        name: app_info.name,
        app_name: app_info.app_name,
        version: app_info.version
    });
    // next()
};
//注册页面
exports.renderRegister = function (req, res) {

    // console.log('1');
    res.render('register', {
        title: 'Register',
        messages: null,
        name: app_info.name,
        app_name: app_info.app_name,
        version: app_info.version
    });
    // next()
};

exports.renderChangePwd = function (req, res) {
    if (!req.session.username) {
        res.render('login', {
            title: 'Login',
            messages: '请先登录',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    } else {
        // console.log('total');
        res.render('reset', {
            title: 'Change Password',
            username: req.session.username,
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    }
};

//买入页面
exports.renderBuy = function (req, res) {
    if (!req.session.username) {
        res.render('login', {
            title: 'Login',
            messages: '请先登录',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    } else {
        res.render('buy', {
            title: 'Buy',
            username: req.session.username,
            url: req.protocol + '://' + req.get('host'),
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    }
};
//个人主页
exports.renderTotal = function (req, res, next) {
    // console.log('1');
    if (!req.session.username) {
        res.render('login', {
            title: 'Login',
            messages: '请先登录',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    } else {
        // console.log('total');
        res.render('total', {
            title: 'Total',
            username: req.session.username,
            url: req.protocol + '://' + req.get('host'),
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    }
};
//查看某个虚币历史页面
exports.renderViewDetails = function (req, res, next) {
    // console.log('1');
    if (!req.session.username) {
        res.render('login', {
            title: 'Login',
            messages: '请先登录',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    } else {
        let bid = req.query.bid; //从请求中获取bid
        // console.log('total');
        res.render('view_details', {
            title: 'Details',
            username: req.session.username,
            bid: bid,  //用bid渲染替代页面上的<%=bid%>,
            url: req.protocol + '://' + req.get('host'),
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
            // messages: null
        });
    }
};

//查看买入和卖出记录
exports.renderSold_out = function (req, res, next) {
    // console.log('1');
    if (!req.session.username) {
        res.render('login', {
            title: 'Login',
            messages: '请先登录',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    } else {
        // console.log('total');
        res.render('sold_out', {
            title: 'sold_out',
            username: req.session.username,
            url: req.protocol + '://' + req.get('host'),
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    }
};