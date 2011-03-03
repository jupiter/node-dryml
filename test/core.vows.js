var ejs = require('..'),
	vows = require('vows'),
    assert = require('assert');

ejs.root = __dirname + '/views';

vows.describe('dryml').addBatch({
	'core dryml tags are included': {
	    'for if/else tags': {
			topic: function(){ ejs.render('<if test="%{ true }">Yes!</if><else>Neh</else><if test="%{ false }">No!</if><else test="%{ false }">Yeh</else><else>Okay</else>', 
			    { debug: false}, this.callback) },
			"'if' should be defined": function(err, buffer) {
				assert.ok(buffer.str.indexOf('<if>') == -1);
			},
			"'if' should work with test attribute": function(err, buffer) {
				assert.include(buffer.str, 'Yes!');	
				assert.ok(buffer.str.indexOf('No!') == -1);		    
			},
			"'else' should work without test": function(err, buffer) {
				assert.ok(buffer.str.indexOf('Neh') == -1);
				assert.include(buffer.str, 'Okay');	    
			},
			"'else' should work with test attribute": function(err, buffer) {
				assert.ok(buffer.str.indexOf('Yeh') == -1);	    
			}						
		},
	    'for nested if/else tags': {
			topic: function(){ ejs.render('<if test="%{ true }">Nearly...<if test="%{ false }">Yes!</if></if><else>Neh</else><if test="%{ false }">No!</if><else test="%{ false }">Yeh</else><else>Okay<if test="%{ false }">Never</if><else test="%{ false }">Never</else></else><else>Never</else>', 
			    { debug: false}, this.callback) },
			"'if' should work with test attribute": function(err, buffer) {
			    assert.include(buffer.str, 'Nearly...');	    
				assert.ok(buffer.str.indexOf('Yes!') == -1);		    
			},
			"'else' should work without test": function(err, buffer) {
				assert.ok(buffer.str.indexOf('Neh') == -1);
				assert.include(buffer.str, 'Okay');	    
			},
			"'else' should work with test attribute": function(err, buffer) {
				assert.ok(buffer.str.indexOf('Yeh') == -1);	    
			},
			"embedded 'if' should not affect outer if/else": function(err, buffer) {
			    assert.ok(buffer.str.indexOf('Never') == -1);	  
			}				
		},		
		'for repeat tag with array': {
			topic: function(){ ejs.render('<repeat obj="%{ testArr }"><li><%= this.value %></li></repeat>', 
			    { debug: false, locals: { testArr: ['a', 'b', 'c', 'd'] } }, this.callback) },
			"each value should be printed": function(err, buffer) {
				assert.include(buffer.str, '<li>a</li>');
				assert.include(buffer.str, '<li>b</li>');
				assert.include(buffer.str, '<li>c</li>');
				assert.include(buffer.str, '<li>d</li>');
			},					
		},
		'for repeat tag with object': {
			topic: function(){ ejs.render('<repeat obj="%{ testObj }"><li class="%{ this.key + ((this.isLast) ? \' last\' : \'\') + ((this.isFirst) ? \' first\' : \'\') }"><%= this.value %> (<%= this.i %>)</li></repeat>', 
			    { debug: false, locals: { testObj: {w:'a', x:'b', y:'c', z:'d'} } }, this.callback) },
			"each value should be printed": function(err, buffer) {
				assert.include(buffer.str, 'a (0)</li>');
				assert.include(buffer.str, '<li class="x">b (1)</li>');
				assert.include(buffer.str, '<li class="y">c (2)</li>');
				assert.include(buffer.str, 'd (3)</li>');
			},
			"that includes boolean for isFirst/isLast": function(err, buffer) {
			    assert.include(buffer.str, '<li class="w first">');
			    assert.include(buffer.str, '<li class="z last">');
			}
		},		
	}
}).export(module);