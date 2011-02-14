/**
 * Module dependencies.
 */

var toStructure = require('../lib/toStructure'),
	assert = require('assert');

(function () {
	var source = '<html><head><title>Something &amp; Else</title></head><body class="test"><!-- A comment  --></body></html>';
	
	toStructure(source, {}, function(result){
		module.exports['structure can include tags with children'] = function() {
			assert.equal(result.length, 1);
			assert.equal(result[0].children.length, 2);
		};
		
		module.exports['structure should convert html entities to text elements'] = function() {
			var element = result[0].children[0].children[0];
			assert.equal(element.element, 'title');
			assert.equal(element.children.length, 3);
			assert.equal(element.children[0].type, 'text');
			assert.equal(element.children[1].type, 'text');
			assert.equal(element.children[2].type, 'text');
			assert.equal(element.children[1].content, '&');
		};
		
		module.exports['structure tags can have attributes'] = function() {
			var element = result[0].children[1];
			assert.equal(element.element, 'body');
			assert.equal(Object.keys(element.attrs).length, 1);
			assert.equal(element.attrs.class, 'test');
		};	
		
		module.exports['structure can contain comment'] = function() {
			var element = result[0].children[1];			
			assert.equal(element.element, 'body');
			assert.equal(element.children.length, 1);
			assert.equal(element.children[0].type, 'comment');
			assert.equal(element.children[0].content.trim(), 'A comment');
		};			
	});
	
	source = '<html><head><title>Something</head><body></body></html>';
	
	toStructure(source, { callbackErrors:true }, function(result){
		module.exports['structure should produce error for unclosed title tag'] = function() {
			assert.equal(result.length, 1);
			var element = result[0];
			assert.equal(element.type, 'error');
			assert.equal(element.element, 'title');
			assert.equal(element.line, 1);
			assert.equal(element.column, 45);
		};
	});
	
	source = '<html><head><title var>Something</title></head></html>';
	
	toStructure(source, { callbackErrors:true }, function(result){
		module.exports['structure should produce error for attributes without values'] = function() {
			assert.equal(result.length, 1);
			var element = result[0];
			assert.equal(element.type, 'error');
			assert.equal(element.element, 'head');
			assert.equal(element.line, 1);
			assert.equal(element.column, 28);
		};
	});
	
	source = '<html><head attribute="%{ Something }"><title><%= Something %></title></head></html>';
	
	toStructure(source, {}, function(result){
		module.exports['structure should produce ejs tag within title tag'] = function() {
			var element = result[0].children[0].children[0];
			assert.equal(element.type, 'tag');
			assert.equal(element.element, 'title');
			assert.equal(element.children[0].element, '%');
			assert.equal(element.children[0].attrs.ejs.trim(), '= Something');

		};
	});	
	
	source = '<html><head attribute="%{ \'Something\' }"><title><%= "Something" %></title></head></html>';
	
	toStructure(source, {}, function(result){
		module.exports['structure can tolerate double-quotes in ejs tags'] = function() {
			var element = result[0].children[0].children[0];
			assert.equal(element.type, 'tag');
			assert.equal(element.element, 'title');
			assert.equal(element.children[0].element, '%');
			assert.equal(element.children[0].attrs.ejs.trim(), '= "Something"');

		};
	});	
	
	
})();