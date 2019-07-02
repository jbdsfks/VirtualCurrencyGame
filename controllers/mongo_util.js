/**
 * mongodb数据库的操作工具
 * 具有通用性
 * 可更改配置
 * 作者：南京理工大学江苏省智能交通感知与数据分析工程实验室
 * 版权所有
 */

var mongodb_config = require('../config/server').mongodb_config;
var MongoClient = require('mongodb');
var DBurl = mongodb_config.url;
var DBname = mongodb_config.db_name;
exports.insertColl = async function (collName, collections) {
    try {
        let db = await MongoClient.connect(DBurl);
        let dbo = db.db(DBname);
        const collection = dbo.collection(collName);
        let bulk = collection.initializeUnorderedBulkOp();
        for (let col of collections) {
            bulk.find({ _id: col._id }).upsert().replaceOne(col);
        }
        let result = await bulk.execute();
        // console.log(result);
        await db.close();
        return Promise.resolve({
            code: 200,
            result: result
        });
    } catch (error) {
        return Promise.resolve({
            code: 400,
            error: error
        })
    }

}
exports.getData = async function (collName, sort, select) {
    try {
        let db = await MongoClient.connect(DBurl);
        let dbo = db.db(DBname);
        const collection = dbo.collection(collName);
        if (sort === undefined) {
            sort = {};
        }
        if (select === undefined) {
            select = {};
        }
        let result = await collection.find(select).sort(sort).toArray();
        await db.close();
        return Promise.resolve({
            code: 200,
            result: result
        });
    } catch (error) {
        return Promise.resolve({
            code: 400,
            error: error
        })
    }
}
exports.getKeyHistory = async function (key, tx_cert_rl_CN) {
    try {
        let db = await MongoClient.connect(DBurl);
        let dbo = db.db(DBname);
        const collection = dbo.collection(key + '_history');
        let select_where = {}
        let proj = { _id: 0 };
        if (tx_cert_rl_CN !== undefined) {
            select_where.tx_cert_rl_CN = tx_cert_rl_CN;
            proj.tx_cert_rl_CN = 0;
        }
        let result = await collection.find(select_where, {
            projection: proj
        }).sort({
            timestamp: 1
        }).toArray();
        await db.close();
        return Promise.resolve({
            code: 200,
            result: result
        });

    } catch (error) {
        return Promise.resolve({
            code: 400,
            error: error
        })
    }
}
exports.getSoldOut = async function (key, timestamp) {
    try {
        let db = await MongoClient.connect(DBurl);
        let dbo = db.db(DBname);
        const collection = dbo.collection(key + '_history');
        let select_where = {
            "timestamp": { $gt: timestamp }
        }
        // console.log(select_where);
        let result = await collection.findOne(select_where, {
            sort: { timestamp: 1 },
            projection: { _id: 0, tx_cert_rl_CN: 0 }
        });
        await db.close();
        if (result !== null) {
            return Promise.resolve({
                code: 200,
                result: result
            });
        } else {
            return Promise.resolve({
                code: 404,
                result: {}
            });
        }
    } catch (error) {
        return Promise.resolve({
            code: 400,
            error: error
        })
    }
}
exports.getMyTxAll = async function (tx_cert_rl_CN) {
    try {
        let db = await MongoClient.connect(DBurl);
        let dbo = db.db(DBname);
        const collection = dbo.collection(mongodb_config.coll_tx_name);
        let result = await collection.find({
            "validcode": 0,
            "tx_cert_rl_CN": tx_cert_rl_CN
        }, {
                projection: { _id: 0, tx_cert_rl_CN: 0 }
            }).sort({
                timestamp: 1
            }).toArray();
        await db.close();
        // console.log(result);
        return Promise.resolve({
            code: 200,
            result: result
        });
    } catch (error) {
        return Promise.resolve({
            code: 400,
            error: error
        })
    }
}
exports.drop = async function () {
    try {
        let db = await MongoClient.connect(DBurl);
        let dbo = db.db(DBname);
        let result = await dbo.dropDatabase();
        await db.close();
        return Promise.resolve({
            code: 200,
            result: result
        });
    } catch (error) {
        return Promise.resolve({
            code: 400,
            error: error
        });
    }
}