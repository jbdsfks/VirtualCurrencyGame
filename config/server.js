/**
 * 系统配置对象
 * 作者：南京理工大学江苏省智能交通感知与数据分析工程实验室
 * 版权所有
 */
const _express_ip_port = {
    "ip": "192.168.1.127",
    "port": 3001
}
const _app_info = {
    "name": "VCG",
    "app_name": "基于Fabric区块链的虚拟货币交易模拟系统",
    "version": "1.0"
}
const _fab_connection = "./config/SimplifyCCP.yaml";
const _mongodb_config = {
    "url": "mongodb://192.168.1.159:27017/",
    "db_name": "virtual_currency",
    "coll_coins_name": "coins",
    "coll_tx_name": "tx"
}
exports.express_ip_port = _express_ip_port;
exports.fab_connection = _fab_connection;
exports.mongodb_config = _mongodb_config;
exports.app_info = _app_info;
