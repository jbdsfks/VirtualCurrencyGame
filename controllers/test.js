var mongodb_util = require('./mongo_util')
var cert = '-----BEGIN CERTIFICATE-----\nMIICijCCAjGgAwIBAgIUGXTUJuPoSa+Bate0hoPSoLB0uuYwCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgxMTAxMTIyMDAwWhcNMTkxMTAxMTIy\nNTAwWjBAMTAwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMBIGA1UECxMLZGVw\nYXJ0bWVudDExDDAKBgNVBAMTA2JiYjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\nBFymEYqmRqy93jkbE6TqwS42owrcblc5besgIdEUCYbqupdP/XI8m5zKXpMfKdHM\n/va3YzpujqLMZSHxGtyAin6jgdUwgdIwDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB\n/wQCMAAwHQYDVR0OBBYEFO4Gd/WxNTJxKkgebPWJtiR8DHRVMCsGA1UdIwQkMCKA\nIEI5qg3NdtruuLoM2nAYUdFFBNMarRst3dusalc2Xkl8MGYGCCoDBAUGBwgBBFp7\nImF0dHJzIjp7ImhmLkFmZmlsaWF0aW9uIjoib3JnMS5kZXBhcnRtZW50MSIsImhm\nLkVucm9sbG1lbnRJRCI6ImJiYiIsImhmLlR5cGUiOiJjbGllbnQifX0wCgYIKoZI\nzj0EAwIDRwAwRAIgbFK33Mu5QuMpDMRJTRy2f1/8fISlZjsPJkVOLYizuxsCIHrU\nKbsweMxHGUZbGU5SXHTSYNgRZEBUVUF7bk64NXs7\n-----END CERTIFICATE-----\n';
(async()=>{
    let time1 = new Date().valueOf();
    console.log(await mongodb_util.getKeyHistory('bid01'));
    let time2 = new Date().valueOf();
    console.log('user time: '+(time2-time1));
})();
