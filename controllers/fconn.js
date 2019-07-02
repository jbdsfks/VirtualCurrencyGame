

var fab_connection = require('../config/server').fab_connection;
var mongoUtil = require('./mongo_util');
/**
 * 根据用户名创建Fabric连接对象
 * @param {*} username 
 * 如果正常就返回连接对象
 * 
 */
exports.FConnect = async function (username) {
    var fc = null;
    // var fs = require('fs');
    // var file = '../fabcar/Fabks.json';
    // if (file == null) {
    //     console.log('需要指定一个连接json文件,如Fabcar.json,或Fabks.json，TLSConn.json');
    //     return;
    // }
    var baseconn = fab_connection;

    try {
        var FabKS = require('../../newfnc/Fabconn');
        fc = new FabKS();
        await fc.connect(baseconn, username);
        await fc.extendFromDiscovery();
        return fc
        // req.session.Fab = fc;
    } catch (err) {
        console.error("连接出错", err);
    }
}

exports.getNewBlcok = async function (block) {
    try {
        let app = require('../app');
        let event = app.get('event');
        // console.log(event);
        let fc = fc_list['admin'];
        now_block_number = block.number;
        console.log("监听到新区块，编号为", now_block_number);
        let add_txall = await fc.txall(now_block_number);
        for (let tx of add_txall) {
            tx._id = tx.tx_id
        }
        let tx_result = await mongoUtil.insertColl('tx', add_txall);

        //更新币的当前值和币历史
        let is_modify_b_history_ok = true;
        let coin_history_results = [];
        let coin_array = [];
        for (let tx of add_txall) {
            for (let ws of tx.writeset) {
                let coin_key = ws.key;
                let coin = await fc.key(coin_key);
                coin._id = tx.tx_id;
                coin.isDelete = false;
                let coin_history_result = await mongoUtil.insertColl(coin_key + '_history', [coin]);
                coin_history_results.push(coin_history_result);
                if (coin_history_result.code !== 200) {
                    is_ok = false;
                }
                delete coin.isDelete;
                coin._id = coin_key;
                coin.key = coin_key;
                coin_array.push(coin);
            }
        }
        let coin_result = await mongoUtil.insertColl('coins', coin_array);

        if (tx_result.code === 200 && coin_result.code === 200 && is_modify_b_history_ok) {
            console.log('同步成功');
            event.emit('getNewBlock');
        } else {
            if (tx_result !== 200) {
                console.error("交易同步出错：" + tx_result.error);
            }
            if (coin_result !== 200) {
                console.error("货币状态同步出错: " + coin_result.error);
            }
            if (!is_modify_b_history_ok) {
                console.error("币历史同步出错: " + coin_history_results);
            }
        }
    } catch (error) {
        console.error("1" + error);
    }


    // if (now_block_number + 1 > block_num['admin']) {
    //     let t1 = new Date().getTime();
    //     let add_txall = await fc_list['admin'].mytxall(block_num['admin'].toString());
    //     let t2 = new Date().getTime();
    //     time += t2 - t1;
    //     for (let add_tx of add_txall) {
    //         txall.push(add_tx)
    //     }
    //     block_num['admin'] = now_block_number + 1;
    //     event.emit('getNewBlock');
    // }
}