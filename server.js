var http  = require('http');
var express = require('express'); 

req_handeller = function(req,res){
    if(req.url == '/')
        res.end('./index.html');
};

var server = http.createServer(function(req.res){
    req_handeller(req,res);
});
server.listen(9000);

