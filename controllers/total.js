/**
 * socket.io api功能部分，
 * 为web浏览器与server的一个双向连接通道
 * 用于响应来自web浏览器的消息请求或为web浏览器主动推送数据更新
 * 
 * 作者：南京理工大学江苏省智能交通感知与数据分析工程实验室
 * 版权所有
 */
var app = require('../app');
var sharedsession = require("express-socket.io-session");
var mongo_utils = require('./mongo_util')
var event = app.get('event');
async function listen(_server) {
    var io = require('socket.io')(_server);
    var total = io
        .use(sharedsession(app.get('session')))
        .on('connection', function (_socket) {
            event.on('getNewBlock', function () {
                _socket.emit('to_update');
            });
            _socket.on('update', function () {
                (async () => {
                    try {
                        let user_content = _socket.handshake.session.user;
                        // console.log(user_content);
                        let coins_result = await mongo_utils.getData('coins');
                        if (coins_result.code === 200) {
                            let coins = coins_result.result;
                            let my_coins = [];       //我的币
                            let other_coins = [];    //他人币
                            let last_tx = coins[0];  //最后一笔交易
                            for (let coin of coins) {
                                last_tx = coin.timestamp > last_tx.timestamp ? coin : last_tx;
                                if (coin.tx_cert_rl_CN === user_content.CN) {
                                    my_coins.push(coin);
                                } else {
                                    other_coins.push(coin);
                                }
                                delete coin.tx_cert_rl_CN;
                            }
                            let total_value = my_coins.length * last_tx.value;
                            let result_data = {
                                code: 200,
                                my_coins: my_coins,
                                other_coins: other_coins,
                                total_value: total_value
                            }
                            _socket.emit('update_table', result_data);
                        }
                        let my_tx_result = await mongo_utils.getMyTxAll(user_content.CN);
                        // console.log(my_tx_result);
                        let buyin = 0;   //买入总价
                        let income = 0;  //卖出总价
                        let profit = 0;  //利润
                        let sold_out_data = [];
                        for (let tx of my_tx_result.result) {
                            let the_buyin = Number(tx.writeset[0].value);   //当前交易的购买价格
                            let the_sold = 0;              //当前交易购入后卖出的价格，可能为0，即还未卖出
                            let the_profit = 0;            //卖出价格-买入时价格
                            let coin_id = tx.writeset[0].key;
                            let sold_out_result = await mongo_utils.getSoldOut(coin_id, tx.timestamp);
                            if (sold_out_result.code === 200) {
                                the_sold = Number(sold_out_result.result.value);
                                sold_out_result.result.key = coin_id;
                                sold_out_data.push(sold_out_result.result);
                                // console.log()
                                the_profit = the_sold - the_buyin;
                            }
                            buyin += the_buyin;
                            income += the_sold;
                            profit += the_profit;
                        }
                        _socket.emit("update_sold_out", sold_out_data);
                        _socket.emit("update_info_box", {
                            buyin: buyin,
                            income: income,
                            profit: profit
                        })

                        let market = [];   //行情数据
                        let txall_result = await mongo_utils.getData('tx', { "timestamp": -1 });
                        let txall = [];
                        if (txall_result.code === 200) {
                            txall = txall_result.result;
                        }
                        let total_tx_num = txall.length;
                        for (let i in txall) {
                            // console.log(tx);
                            let write_set = txall[total_tx_num - i - 1].writeset;
                            let timestamp = txall[total_tx_num - i - 1].timestamp;
                            let value = write_set[0].value;
                            market.push({
                                'timestamp': timestamp,
                                'value': value
                            });
                            if (market.length > 30) {
                                break;
                            }
                        }
                        _socket.emit('update_line', market);
                    }
                    catch (error) {
                        console.log(error);
                    }
                })();
            });
            _socket.on('update_details', function (bid) {
                console.log("bid: " + bid);
                (async () => {
                    try {
                        let CN = _socket.handshake.session.user.CN;
                        let coin_history_result = await mongo_utils.getKeyHistory(bid);
                        if (coin_history_result.code === 200) {
                            let coin_history = coin_history_result.result;
                            for (let coin of coin_history) {
                                // console.log(coin);
                                if (coin.tx_cert_rl_CN === CN) {
                                    coin.isMine = true;
                                } else {
                                    coin.isMine = false;
                                }
                                delete coin.tx_cert_rl_CN;
                            }
                            _socket.emit('update_details', coin_history);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                })();
            });
            _socket.on("init", function (username) {
                (async () => {
                    try {
                        console.log(username + '建立连接！')
                        let fc = fc_list[username];
                        let user = await fc.getkvAll();
                        let user_content = {};
                        user_content.CN = JSON.parse(user.member).name;
                        user_content.name = username;
                        _socket.handshake.session.user = user_content;
                        // console.log(_socket.handshake.session.user);
                        _socket.handshake.session.save();
                        _socket.emit('to_update');
                    } catch (error) {
                        console.log(error);
                    }
                })();
            });

            _socket.on('disconnect', function () {
                try {
                    event.removeListener('getBlockNum', function () {
                        console.log('移除成功')
                    });
                    if (_socket.handshake.session.user) {
                        console.log(_socket.handshake.session.user.name + '断开/total的连接！');
                        delete _socket.handshake.session.user;
                        _socket.handshake.session.save();
                    }
                } catch (error) {
                    console.log(error);
                }


            });
        });
}

exports.listen = async function (_server) {
    return await listen(_server);
};