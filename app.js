/**
 * server配置及server初始化
 * 
 * 作者：南京理工大学江苏省智能交通感知与数据分析工程实验室
 * 版权所有
 */

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session');

var FConn = require('./controllers/fconn');

global.fc_list = {};
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
    app.use(compress());
}

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
var my_session = session({
    saveUninitialized: true,
    resave: true,
    secret: 'developmentSessionSecret'
});
app.use(my_session);
app.set('session', my_session);

app.use(express.static(path.join(__dirname, 'public')));

app.engine('.html', require('ejs').__express);
app.set('views', './public');
app.set('view engine', 'html');

require('./routes/routeApi.js')(app);
require('./routes/routePage.js')(app);
// require('./routes/api.js')(app);
// app.use('/users', usersRouter);

//event.js 文件
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();

app.set('event', event);
// console.log(event);

var mongoUtil = require('./controllers/mongo_util');
var mongodb_config = require('./config/server').mongodb_config;
// 服务初始化
(async () => {
    let fc = await FConn.FConnect('admin');
    fc_list['admin'] = fc;

    //清空mongo库
    let drop_result = await mongoUtil.drop();
    console.log(drop_result);

    // await fc.addjson('../fabcar/init.json');
    // //更新币的当前值
    let coins_json = await fc.keys('bid01', 'bid99');
    // console.log(coins_json);
    let coins_array = [];
    for (let key in coins_json) {
        let coin = coins_json[key];
        coin._id = key;
        coin.key = key;
        coins_array.push(coin);
    }
    // console.log(coins_array);
    let coin_result = await mongoUtil.insertColl(mongodb_config.coll_coins_name, coins_array);

    //更新交易
    let txall = await fc.txall("2");
    for (let tx of txall) {
        if(tx.tx_cert_rl_CN.startsWith("Admin"))
            delete tx;
        tx._id = tx.tx_id
    }
    let tx_result = await mongoUtil.insertColl(mongodb_config.coll_tx_name, txall);

    //币历史  这里默认的是五个币bid01-bid05
    let coin_history_results = [];
    let is_ok = true;
    for (let i = 1; i < 6; i++) {
        let coin_history = await fc.keyhistory('bid0'+i);
        for (let coin of coin_history) {
            coin._id = coin.tx_id
        }
        let coin_history_result = await mongoUtil.insertColl('bid0'+i+'_history', coin_history);
        if(coin_history_result.code === 200){
            coin_history_results.push(coin_history_result);
        }else{
            is_ok = false;
        }
    }
    if (coin_result.code === 200 && tx_result.code === 200 && is_ok === true) {
        console.log("服务器状态初始化成功！")
    } else {
        if (coin_result.code !== 200) {
            console.log("货币初始化出错: " + coin_result.error);
        }
        if (tx_result.code !== 200) {
            console.log("交易初始化出错: " + tx_result.error);
        }
        console.log("币历史初始化出错：" + coin_history_results);
    }

    await fc.blocklisten(FConn.getNewBlcok);
})();

module.exports = app;
