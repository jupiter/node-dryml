/**
 * Module dependencies.
 */

var express = require('express'),
	dryml = require('../..');
	
dryml.root = __dirname + '/';

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
	dryml.renderView('index', { trimWhitespace:false, locals: { one: 'One', two: 'Two', three: 'Three' }}, res);
});

app.get('/notdefined', function(req, res){
	dryml.renderView('notdefined', { trimWhitespace:false, locals: { one: 'One', two: 'Two', three: 'Three' }}, res);
});

app.get('/notdefined-attr', function(req, res){
	dryml.renderView('notdefined-attr', { trimWhitespace:false, locals: { one: 'One', two: 'Two', three: 'Three' }}, res);
});

app.get('/parsing', function(req, res){
	dryml.renderView('parsing', { trimWhitespace:false, locals: { one: 'One', two: 'Two', three: 'Three' }}, res);
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port)
}
