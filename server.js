var http  = require('http');
var express = require('express'); 

req_handeller = function(req,res){
    if(req.url == '/')
    res.redirect('./index.html');
};

var server = http.createServer(req_handeller);
server.listen(process.env.OPENSHIFT_NODEJS_PORT || 8080,process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1');

