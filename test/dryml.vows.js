var ejs = require('..'),
	vows = require('vows'),
    assert = require('assert');

ejs.root = __dirname + '/views';

vows.describe('dryml').addBatch({
	'define tags': {
		'with simple output': {
			topic: ejs.render('<def tag="test"><p class="temp">Simple</p></def><body><test/></body>', {}, this.callback),
			'return': function(buffer) {
				assert.equal(buffer.str, '<body><p class="temp">Simple</p></body>');
			}
		},
		'that call defined other tags': {
			topic: ejs.render('<def tag="header"><head><title>Something</title></head></def><def tag="test"><header/><body><p>Simple</p></body></def><test/>', {}, this.callback),
			'return': function(buffer) {
				assert.equal(buffer.str, '<head><title>Something</title></head><body><p>Simple</p></body>');
			}
		},		
		'with attributes available as local vars': {
			topic: function(){ ejs.render('<def tag="header" attrs="title"><title><%= title %></title><meta><%= attributes["add"] %></meta></def><header title="Something" add="dynamic"/>', {}, this.callback) },
			'return': function(err, buffer) {
				assert.equal(buffer.str, '<title>Something</title><meta>dynamic</meta>');
			}
		},
		'with tagbody': {
			topic: function(){ ejs.render('<def tag="header"><title><tagbody/></title></def><header>Something</header>', {}, this.callback) },
			'return': function(err, buffer) {
				assert.equal(buffer.str, '<title>Something</title>');
			}
		},
		'with nested calls to the same tag': {
			topic: function(){ ejs.render('<def tag="test"><ul><tagbody/></ul></def><p><test><li><test>Something</test></li></test></p>', {}, this.callback) },
			'return': function(err, buffer) {
				assert.equal(buffer.str, '<p><ul><li><ul>Something</ul></li></ul></p>');
			}
		},		
	},
	'import taglibs': {		
		'with simple definitions': {
			topic: function(){ ejs.render('<taglib src="simple.taglib"/><body><hello /></body>', {}, this.callback) },
			'return': function(err, buffer) {
				assert.equal(buffer.str, '<body><div>hello</div></body>');
			}
		},
		'with nested taglib': {
			topic: function(){ ejs.render('<taglib src="sub/nested.taglib"/><body><hello /><another /></body>', {}, this.callback) },
			'return': function(err, buffer) {
				assert.equal(buffer.str, '<body><div>hello</div><div>another</div></body>');
			}
		}		
	},
	'html': {
		'with simple attributes': {
			topic: ejs.render('<p class="two"><a href="someplace.html" title="something">Body Text</a></p>', {}, this.callback),
			'return': function(buffer) {
				assert.equal(buffer.str, '<p class="two"><a href="someplace.html" title="something">Body Text</a></p>');
			}
		},
		'with ejs in attributes': {
			topic: function(){ ejs.render('<p class="%{\'two\'}"><a href="someplace.html" title="%{\'some\' + \'thing\'}"><%= "Body " + "Text" %></a></p>', {}, this.callback) },
			'return': function(err, buffer) {
				assert.equal(buffer.str, '<p class="two"><a href="someplace.html" title="something">Body Text</a></p>');
			}
		}
	},
	'options': {
		'make locals available nested': {
			topic: function(){ ejs.render('<taglib src="simple.taglib"/><first><%= myLocal %></first><second><p><%= myLocal %></p></second><coinslot><%= myLocal %></coinslot><coinslot><p><%= myLocal %></p></coinslot><coinslot><coinslot><%= myLocal %></coinslot></coinslot>', 
				{ locals: { myLocal: "Here"}}, this.callback) },
			'at first html level': function(err, buffer) {
				assert.includes(buffer.str, '<first>Here</first>');
			},
			'at second html level': function(err, buffer) {
				assert.includes(buffer.str, '<second><p>Here</p></second>');
			},
			'inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot">Here</div>');
			},
			'inside defined tag tagbody nested in html': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot"><p>Here</p></div>');
			},		
			'inside defined tag tagbody nested in a defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot"><div class="slot">Here</div></div>');
			}						
		}			
	},
	'pass context': {
		'from options.scope': {
			topic: function(){ ejs.render('<taglib src="simple.taglib"/><first><%= this %></first><second><p><%= this %></p></second><coinslot><%= this %></coinslot><coinslot><p><%= this %></p></coinslot>', 
				{ scope: "Here"}, this.callback) },
			'at first html level': function(err, buffer) {
				assert.includes(buffer.str, '<first>Here</first>');
			},
			'at second html level': function(err, buffer) {
				assert.includes(buffer.str, '<second><p>Here</p></second>');
			},
			'inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot">Here</div>');
			},
			'inside defined tag tagbody nested in html': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot"><p>Here</p></div>');
			}
		},
		'with obj attribute': {
			topic: function() { ejs.render('<taglib src="simple.taglib"/><p><with obj="%{ someObj }">Print this:<%= this %></with></p><p><with obj="Yeah!">No, print this:<em><%= this %></em></with></p><coinslot obj="%{ someObj }"><%= this %></coinslot><with obj="%{ someObj }"><p><coinslot><%= this %></coinslot></p></with>',
			{ locals: { someObj: 'Yeah!'}}, this.callback) },
			'at base level of tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<p>Print this:Yeah!</p>');
			},
			'at first html level': function(err, buffer) {
				assert.includes(buffer.str, '<p>No, print this:<em>Yeah!</em></p>');
			},
			'inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot">Yeah!</div>');
			},
			'nested inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<p><div class="slot">Yeah!</div></p>');
			},
		}
	},
	'pass attributes': {
		'which are defined': {
			topic: function() { ejs.render('<taglib src="simple.taglib"/><div><print first="First" second="Second" third="Third">A tagbody.</print></div>', {}, this.callback) },
			'at first html level': function(err, buffer) {
				assert.includes(buffer.str, '<div><first>First</first>');
			},
			'at second html level': function(err, buffer) {
				assert.includes(buffer.str, '<p><second>Second</second></p>');
			},
			'inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot"><p><third>Third</third></p></div>');
			}
		},
		'which are ad hoc': {
			topic: function() { ejs.render('<taglib src="simple.taglib"/><div><uprint first="First" second="Second" third="Third">A tagbody.</uprint></div>', {}, this.callback) },
			'at first html level': function(err, buffer) {
				assert.includes(buffer.str, '<div><first>First</first>');
			},
			'at second html level': function(err, buffer) {
				assert.includes(buffer.str, '<p><second>Second</second></p>');
			},
			'inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot"><p><third>Third</third></p></div>');
			}
		},
		'in attribute tags': {
			topic: function() { ejs.render('<taglib src="simple.taglib"/><div><print><attr:first>First</attr:first><attr:second>Second</attr:second><attr:third>Third</attr:third></print></div>', 
				{}, this.callback) },
			'at first html level': function(err, buffer) {
				assert.includes(buffer.str, '<div><first>First</first>');
			},
			'at second html level': function(err, buffer) {
				assert.includes(buffer.str, '<p><second>Second</second></p>');
			},
			'inside defined tag tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<div class="slot"><p><third>Third</third></p></div>');
			}
		}						
	},
	'asynchronous ejs': {
		'can be implemented in a defined tag': {
			topic: function(){ ejs.render('<taglib src="simple.taglib"/><asyncto><p>Woohoo!</p></asyncto><asyncto><p><%? setTimeout(function(){ buffer.print("After"); buffer.end() }, 500) %></p></asyncto>', 
				{ locals: {}, debug: false}, this.callback) },
			'to return a string with ejs': function(err, buffer) {
				assert.includes(buffer.str, '<p>Output</p>');
			},
			'to return the tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<p>Woohoo!</p>');
			},
			'to return async buffer in tagbody': function(err, buffer) {
				assert.includes(buffer.str, '<p>After</p>');
			},							
		},		
	},
	'attribute tags': {
		'can contain ejs': {
			topic: function(){ ejs.render('<taglib src="simple.taglib"/><print><attr:first><p><%= "Some String" %></p></attr:first></print><print><attr:first><p><%? setTimeout(function(){ buffer.print("After"); buffer.end() }, 1000) %></p></attr:first></print>', 
				{ locals: {}, debug: false}, this.callback) },
			'returning a string': function(err, buffer) {
				assert.includes(buffer.str, '<first><p>Some String</p></first>');
			},		
			'returning asynchronous buffer': function(err, buffer) {
				assert.includes(buffer.str, '<first><p>After</p></first>');
			}							
		},	
	},
	'ejs in attributes': {
		'must be able to access': {
			topic: function(){ ejs.render('<taglib src="simple.taglib"/><print first="%{ someStr }" /><with obj="%{ someObj }"><div><print first="%{ this.str }"/></div><div><print><attr:first><%= this.alt %></attr:first></print></div></with>', 
				{ locals: { someStr: "Here", someObj: { str: "New", alt: "Alt"}}, debug: false}, this.callback) },
			'locals': function(err, buffer) {
				assert.includes(buffer.str, '<first>Here</first>');
			},		
			'parent context': function(err, buffer) {
				assert.includes(buffer.str, '<first>New</first>');
			},
			'parent context in attribute tag': function(err, buffer) {
				assert.includes(buffer.str, '<first>Alt</first>');
			},								
		},
	},
}).export(module);