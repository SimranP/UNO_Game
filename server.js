var http  = require('http');
var express = require('express'); 
var app = express();

app.get('/',function(req,res){
    res.end('hello');
})

var server = http.createServer(app);
server.listen(process.env.OPENSHIFT_NODEJS_PORT || 8080,process.env.OPENSHIFT_NODEJS_IP||'127.0.0.1');

