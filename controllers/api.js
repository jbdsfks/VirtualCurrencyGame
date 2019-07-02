/**
 * 响应客户端api请求，调用API，返回json结果作为响应
 * 注意，方法名应与routeApi.js保持一致
 * 额外，login将重定向到total页面，logout将渲染login页面
 * 可响应：
 * [1]Web客户端的ajax请求
 * [2]移动客户端的http请求
 * 
 * 作者：南京理工大学江苏省智能交通感知与数据分析工程实验室
 * 版权所有
 */
var FConn = require('./fconn');
var crypto = require('crypto');
var mongodb_util = require('./mongo_util')
var app_info = require('../config/server').app_info;
exports.login = function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;
    (async () => {
        try {
            let fc = await FConn.FConnect(username);

            let user = await fc.getkvAll();
            if (user && user.password === password) {
                req.session.username = username;
                req.session.CN = JSON.parse(user.member).name;
                fc_list[username] = fc;
                return res.redirect('total');
            } else {
                return res.render('login', {
                    title: 'Login',
                    messages: '密码错误',
                    name: app_info.name,
                    app_name: app_info.app_name,
                    version: app_info.version
                });
            }

        } catch (err) {
            console.log('连接出错：', err);
            if (err) {
                return res.render('login', {
                    title: 'Login',
                    messages: err,
                    name: app_info.name,
                    app_name: app_info.app_name,
                    version: app_info.version
                });
            }
        }
    })();
};

exports.logout = function (req, res, next) {
    let username = req.session.username;
    req.session.destroy();
    return res.render('login', {
        title: 'Login',
        messages: '已退出!',
        name: app_info.name,
        app_name: app_info.app_name,
        version: app_info.version
    });
};


exports.confirm = function (req, res, next) {
    let username = req.body.username;
    console.log(username);
    try {
        (async () => {
            let fc = fc_list["admin"];
            if (fc === undefined) {
                fc = await FConn.FConnect("admin");
                fc_list["admin"] = fc;
            }
            let isPass = false;
            if (username !== '') {
                isPass = await fc.isReg(username);
                res.write(isPass.toString());
            }
            res.end();
        })()
    } catch (err) { }
};
exports.register = function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    (async () => {
        try {
            //begin
            let fc = fc_list["admin"];
            if (fc === undefined) {
                fc = await FConn.FConnect("admin");
                fc_list["admin"] = fc;
            }
            let ext_attr = {};
            ext_attr.password = password;
            affiliation = 'org1.department1';
            await fc.reg2kvEx(username, affiliation, "[\"user\"]", ext_attr);
            return res.render('login', {
                title: 'Login',
                messages: '注册成功',
                name: app_info.name,
                app_name: app_info.app_name,
                version: app_info.version
            });

            //end
        } catch (err) {
            console.log('注册出错:', err);
            return res.render('register', {
                title: 'Register',
                messages: '注册失败：' + err,
                name: app_info.name,
                app_name: app_info.app_name,
                version: app_info.version
            });
        }
    })();
};

exports.changePwd = function (req, res, next) {
    let username = req.session.username;
    let old_pwd = req.body.old_pwd;
    let new_pwd = req.body.new_pwd;
    (async () => {
        try {

            let fc = fc_list[username];
            let isPass = await fc.isPwdPass(old_pwd);
            let result = {};
            if (!isPass) {
                result.code = 401;
                result.message = '原密码错误！';
            } else {
                await fc.setPwd(username, new_pwd);
                result.code = 200;
                result.message = '修改成功，请重新登录！';
            }
            res.write(JSON.stringify(result));
            res.end();
        } catch (err) {
            res.write(JSON.stringify({
                code: 500,
                message: '修改密码错误:' + err
            }));
            res.end();
        }
    })()
};
exports.getMyTxHistory = function (req, res) {
    var username = req.session.username;
    // console.log(username);
    if (username === null) {
        return res.render('login', {
            title: 'Login',
            messages: '请先登录!',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    }
    let data = [];
    (async () => {
        try {
            let cert = req.session.cert;
            let mt_tx_all_result = await mongodb_util.getMyTxAll(cert);
            if (mt_tx_all_result.code === 200) {
                for (let tx of mt_tx_all_result.result) {
                    for (let the_b of tx.writeset) {
                        //把买入加到返回的json数组里。
                        the_b.block_num = tx.block_num;
                        the_b.tx_num = tx.tx_num;
                        the_b.timestamp = tx.timestamp;
                        the_b.isBuy = true;
                        data.push(the_b);
                    }
                }
            }
            res.write(JSON.stringify(data));
        } catch (err) {
            console.error(err);
            res.write('错误:' + err); //?
            //res.end(err.stringify()) //输出?
        }
        res.end();
    })();
};
//通用API调用， 比如 /?cmd=query('history','bid01')
exports.api = function (req, res, next) {
    var username = req.session.username;
    if (username === null) {
        return res.render('login', {
            title: 'Login',
            messages: '请先登录!',
            name: app_info.name,
            app_name: app_info.app_name,
            version: app_info.version
        });
    }
    (async () => {
        try {
            // let ret = await eval(cmd);
            var fc = fc_list[username];
            var cmd = 'fc.' + req.body.cmd;
            console.log(cmd);
            if (cmd.startsWith('fc.invoke')) {
                eval(cmd); //注意，invoke调用也可能有返回，但invoke(put,k,v)无返回
                res.write(JSON.stringify({
                    code: 200,
                    message: '提交交易成功！'
                }));
            } else {
                var ret = await eval(cmd);
                console.log(ret);
                if (ret !== undefined) {
                    res.write(JSON.stringify(ret))
                    // res.write(ret)
                }
            }
        } catch (err) {
            console.error(err);
            res.write('错误:' + err); //?
            //res.end(err.stringify()) //输出?
        }
        res.end();
    })();
};