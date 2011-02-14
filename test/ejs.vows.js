var ejs = require('..'),
	vows = require('vows'),
    assert = require('assert');

ejs.root = __dirname + '/views';

vows.describe('dryml').addBatch({
	'should support standard ejs': {
		'with html': {
			topic: ejs.render('<p>Simple</p>', {}, this.callback),
			'returns same html': function(buffer) {

				assert.equal(buffer.str, '<p>Simple</p>');
			}
		},
		'with inline code': {
			topic: ejs.render('<% var wasTrue = true %>\n' 
							+ '<p><%= "First" %></p>\n'
			 				+ '<p><% if (wasTrue) { %><br/><% } %></p>\n' 
							+ '<p><%= (wasTrue) ? "True" : "False" %></p>\n', {}, this.callback),
			'returns output to buffer': function(buffer) {
				assert.includes(buffer.str, '<p>First</p>');
			},
			'executes unbuffered code': function(buffer) {
				assert.includes(buffer.str, '<br/>');
			},
			'retains variables from unbuffered code in upper context': function(buffer) {
				assert.includes(buffer.str, '<p>True</p>');
			}
		},
		'with scope': {
			topic: ejs.render('<p><%= this %></p>', { scope: 'Scope String' }, this.callback),
			'at top level, as render option': function(buffer) {
				assert.includes(buffer.str, '<p>Scope String</p>')
			}
		},
		'with locals': {
			topic: ejs.render('<% if (name) { %>\n<p><%= name %></p>\n<p><%= email %></p><% } %>', 
								{ locals: { name: 'tj', email: 'tj@sencha.com' } }, this.callback),
			'retaining line breaks': function(buffer) {
				assert.equal(buffer.str, '\n<p>tj</p>\n<p>tj@sencha.com</p>')
			}			
		},
		'with quotes': {
			topic: ejs.render("<p><%= up('wahoo') %></p>", { locals: { up: function(str){ return str.toUpperCase(); }} }, this.callback),
			'and function as local': function(buffer) {
				assert.equal(buffer.str, '<p>WAHOO</p>')
			}			
		},
		'with multiple single quotes in html and ejs': {
			topic: ejs.render("<p>couldn't can't<em><%= 'should' %>n't</em></p>", {}, this.callback),
			'': function(buffer) {
				assert.equal(buffer.str, "<p>couldn't can't<em>shouldn't</em></p>")
			}			
		},
		'with backslashes in document': {
			topic: ejs.render("<p>backslash: '\\'</p>", {}, this.callback),
			'': function(buffer) {
				assert.equal(buffer.str, "<p>backslash: '\\'</p>")
			}			
		},
		'with double-quotes': {
			topic: ejs.render('<p><%= up("wahoo") %></p>', { locals: { up: function(str){ return str.toUpperCase(); }} }, this.callback),
			'and function as local': function(buffer) {
				assert.equal(buffer.str, '<p>WAHOO</p>')
			}			
		},		
		'with multiple double quotes in html': {
			topic: ejs.render('<p>This is a "simple" <em><%= "test" %>. "Innit?"</em></p>', {}, this.callback),
			'': function(buffer) {
				assert.equal(buffer.str, '<p>This is a "simple" <em>test. "Innit?"</em></p>')
			}			
		},
		'with iteration': {
			topic: ejs.render('<% for (var key in items) { %>'
		                	+ '<p><%= items[key] %></p>'
		                	+ '<% } %>', { locals: { items: ['one', 'two', 'three'] }}, this.callback),
			'': function(buffer) {
				assert.equal(buffer.str, '<p>one</p><p>two</p><p>three</p>');
			}
		},
		'with callback/functional iteration': {
			topic: ejs.render('<% items.forEach(function(item){ %>'
			                + '<p><%= item %></p>'
			                + '<% }) %>', { locals: { items: ['one', 'two', 'three'] }}, this.callback),
			'': function(buffer) {
				assert.equal(buffer.str, '<p>one</p><p>two</p><p>three</p>');
			}
		}	
	}	
}).export(module);