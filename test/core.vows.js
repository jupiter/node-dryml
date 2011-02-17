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
		'for repeat tag': {
			topic: function(){ ejs.render('<repeat obj="%{ testArr }"><li><%= this %></li></repeat>', 
			    { debug: false, locals: { testArr: ['a', 'b', 'c', 'd'] } }, this.callback) },
			"each value should be printed": function(err, buffer) {
				assert.include(buffer.str, 'a');
				assert.include(buffer.str, 'b');
				assert.include(buffer.str, 'c');
				assert.include(buffer.str, 'd');
			},					
		},
	}
}).export(module);