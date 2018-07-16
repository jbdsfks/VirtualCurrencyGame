/**
 * Created by coofly on 2014/7/12.
 */
var io = require('socket.io')();
var session = require("express-session")({
        secret: "my-secret",
        resave: true,
        saveUninitialized: true
    }),
    sharedsession = require("express-socket.io-session");

io.use(sharedsession(session));

io.sockets.on('connection', function (_socket) {
    _socket.on('buy', function (username, cmd) {
        let fc = fc_list[username];
        (async()=>{
            try {
                cmd = 'fc.'+cmd;
                let ret = await eval(cmd);
                _socket.emit('buy', {
                    code: 200,
                    message: '购买成功！'
                });
                _socket.broadcast.emit('to_update');
            }catch (e) {
                console.log(e);
            }
        })();
    });

    _socket.on('update', function (username) {
        console.log('socket:'+ username);
        (async () => {
            try {
                //获取登录用户的中间件连接
                var fc = fc_list[username];

                // 初始化所有交易缓存，该过程只需要进行一次
                if (_socket.handshake.session.txall === undefined){
                    _socket.handshake.session.txall = await fc.mytxall("2");
                    // _socket.handshake.session.txall = txall;
                    _socket.handshake.session.save();
                }

                // 初始化登录用户的交易缓存，该过程只需要进行一次
                if (_socket.handshake.session.user_tx_id === undefined){
                    let mytx = await fc.mytx();
                    let mytx_id = [];
                    for (let tx of mytx){
                        mytx_id.push(tx.tx_id);
                    }
                    _socket.handshake.session.user_tx_id = mytx_id;
                    _socket.handshake.session.save();
                    // console.log(user_tx_id);
                }

                //初始化最后一个区块编号
                if (_socket.handshake.session.block_num === undefined){
                    _socket.handshake.session.block_num = await fc.getBlocknum();
                    _socket.handshake.session.save();
                }

                //获取当前区块编号
                let now_block_num = await fc.getBlocknum();
                if (now_block_num > _socket.handshake.session.block_num){                  //更新缓存

                    let add_tx = await fc.mytxall((_socket.handshake.session.block_num).toString());

                    for (let tx of add_tx){
                        _socket.handshake.session.txall.push(tx);
                    }

                    let add_mytx = await fc.mytx((_socket.handshake.session.block_num).toString());
                    for (let tx of add_mytx){
                        _socket.handshake.session.user_tx_id.push(tx.tx_id);
                    }
                    // block_num = now_block_num;
                }

                //更新两个表和总市值
                var ret = await fc.mykeys("bid01", "bid99");
                // console.log(ret);
                _socket.emit('update_table', ret);

                let profit = 0; //利润
                let income = 0; //卖出总价
                let buyin = 0; //买入总价

                for (let mytx_id of _socket.handshake.session.user_tx_id) {           //遍历当前用户的所有tx_id
                    let my_tx = {};              //比对到的交易信息
                    for (let tx of _socket.handshake.session.txall){          //从所有的交易缓存中查找当前交易信息
                        if (tx.tx_id === mytx_id){
                            my_tx = tx;
                            break;
                        }
                    }
                    let writeset = my_tx.writeset;    //得到当前交易中的写集

                    for (let the_b of writeset) {
                        let the_tx_value = 0;
                        let now_value = 0;
                        //let the_history = await eval('fc.query("history","' + the_b['key'] + '")');

                        if (_socket.handshake.session.historys === undefined ||
                            _socket.handshake.session.historys[the_b['key']] === undefined ||
                            now_block_num > _socket.handshake.session.block_num){

                            //更新货币历史
                            let the_history = await fc.query("history", the_b['key']); //key历史
                            the_history = JSON.parse(the_history);
                            _socket.handshake.session.historys = {};
                            _socket.handshake.session.historys[the_b['key']]= the_history;
                            _socket.handshake.session.save();
                        }


                        let the_history = _socket.handshake.session.historys[the_b.key];
                        let count = 0;
                        for (let k = 0; k < the_history.length; k++) {

                            if (the_history[k].txid === mytx_id) {
                                count = k;
                            }
                        }
                        //此时count指向买入交易
                        //the_tx_value = Number(the_history[count]['value']); //买入价格
                        the_tx_value = Number(the_history[count].value); //买入价格
                        buyin += the_tx_value;
                        if (count !== (the_history.length - 1)) { //买入交易是否为最后交易
                            now_value = Number(the_history[count + 1].value); //若不是，下一个交易就是卖出，取卖出价格
                            income += now_value;
                            profit += (now_value - the_tx_value);
                        }
                    }
                } //以上计算比较复杂，能否简化？
                _socket.emit('update_info_box', {
                    'income': income,
                    'profit': profit,
                    'buyin': buyin
                });


                let market = [];   //行情数据
                for (let tx of _socket.handshake.session.txall) {
                    // console.log(tx);
                    let write_set = tx.writeset;
                    let timestamp = tx.timestamp;
                    let value = write_set[0].value;
                    market.push({
                        'timestamp': timestamp,
                        'value': value
                    });
                }
                _socket.emit('update_line', market);

                // 更新区块数量
                _socket.handshake.session.block_num = now_block_num;
            } catch (err) {
                console.error(err);
            }
        })();
    });

    _socket.on('update_details',function(username, bid){
        console.log(username);
        console.log("bid: " + bid);
        (async () => {
            try{
                var fc = fc_list[username];
                var ret = await fc.mykeyhistory(bid);
                // console.log(ret);
                _socket.emit('update_details', ret);
            }catch(err){
                console.error(err);
            }
        })();
    });
});

exports.listen = function (_server) {
    return io.listen(_server);
};