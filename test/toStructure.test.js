/**
 * Module dependencies.
 */

var toStructure = require('../lib/toStructure'),
	assert = require('assert');

(function () {
	var source = '<html><head><title>Something &amp; Else</title></head><body class="test"><!-- A comment  --></body></html>';
	
	toStructure(source, {}, function(err, result){
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
	
	toStructure(source, { callbackErrors:true }, function(err, result){
		module.exports['structure should produce error for unclosed title tag'] = function() {
            assert.ok(err);
		};
	});
	
	source = '<html><head><title var>Something</title></head></html>';
	
	toStructure(source, { callbackErrors:true }, function(err, result){
		module.exports['structure should produce error for attributes without values'] = function() {
		    assert.ok(err);
		};
	});
	
	source = '<html><head attribute="%{ Something }"><title><%= Something %></title></head></html>';
	
	toStructure(source, {}, function(err, result){
		module.exports['structure should produce ejs tag within title tag'] = function() {
			var element = result[0].children[0].children[0];
			assert.equal(element.type, 'tag');
			assert.equal(element.element, 'title');
			assert.equal(element.children[0].element, '%');
			assert.equal(element.children[0].attrs.ejs.trim(), '= Something');

		};
	});	
	
	source = '<html><head attribute="%{ \'Something\' }"><title><%= "Something" %></title></head></html>';
	
	toStructure(source, {}, function(err, result){
		module.exports['structure can tolerate double-quotes in ejs tags'] = function() {
			var element = result[0].children[0].children[0];
			assert.equal(element.type, 'tag');
			assert.equal(element.element, 'title');
			assert.equal(element.children[0].element, '%');
			assert.equal(element.children[0].attrs.ejs.trim(), '= "Something"');

		};
	});	
	
	source = '<html><head><script type="text/Javascript"><![CDATA[ alert("<a>Woohoo</a>"); ]]></script><a href="javascript:alert(\'&lt;a&gt;Waahaa&lt;/a&gt;\');">Help</a></head></html>';
	
	toStructure(source, {}, function(err, result){
		module.exports['structure can tolerate script within CDATA tag'] = function() {
			var element = result[0].children[0].children[0];
			assert.equal(element.type, 'tag');
			assert.equal(element.element, 'script');
			assert.equal(element.children[0].type, 'text');
			assert.includes(element.children[0].content, 'alert("<a>Woohoo</a>");');
		};
		module.exports['structure can tolerate script within attribute if properly escaped'] = function() {
			var element = result[0].children[0].children[1];
			assert.equal(element.type, 'tag');
			assert.equal(element.element, 'a');
			assert.ok(element.attrs['href']);
			assert.includes(element.attrs['href'], 'alert(\'<a>Waahaa</a>\');');
		};		
	});	
})();