var ejs = require('..'),
vows = require('vows'),
assert = require('assert');

ejs.root = __dirname + '/views';
ejs.encodeEntities = false;

vows.describe('dryml').addBatch({
    'define tags': {
        'with simple output': {
            topic: function(){
              ejs.render('<def tag="test"><p class="temp">Simple</p></def><body><test/></body>', {},
                          this.callback);                        
            },
            'return': function(buffer) {
                assert.equal(buffer.str, '<body><p class="temp">Simple</p></body>');
            }
        },
        'that call defined other tags': {
            topic: function(){
              ejs.render('<def tag="xheader"><head><title>Something</title></head></def><def tag="test"><xheader/><body><p>Simple</p></body></def><test/>', {},
                         this.callback);
            },
            'return': function(buffer) {
                assert.equal(buffer.str, '<head><title>Something</title></head><body><p>Simple</p></body>');
            }
        },
        'with attributes available as local vars': {
            topic: function() {
                ejs.render('<def tag="xheader" attrs="title"><title><%= title %></title><meta><%= attributes["add"] %></meta></def><xheader title="Something" add="dynamic"/>', {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.equal(buffer.str, '<title>Something</title><meta>dynamic</meta>');
            }
        },
        'with tagbody': {
            topic: function() {
                ejs.render('<def tag="xheader"><title><tagbody/></title></def><xheader>Something</xheader>', {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.equal(buffer.str, '<title>Something</title>');
            }
        },
        'with nested calls to the same tag': {
            topic: function() {
                ejs.render('<def tag="test"><ul><tagbody/></ul></def><p><test><li><test>Something</test></li></test></p>', {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.equal(buffer.str, '<p><ul><li><ul>Something</ul></li></ul></p>');
            }
        },
    },
    'import taglibs': {
        'with simple definitions': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><body><hello /></body>', {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.equal(buffer.str, '<body><div>hello</div></body>');
            }
        },
        'with nested taglib with includeAllTaglibs setting': {
            topic: function() {
                ejs.render('<taglib src="sub/nested.taglib" /><body><hello /><another /></body>', { includeAllTaglibs: true },
                this.callback)
            },
            'return': function(err, buffer) {
                assert.equal(buffer.str, '<body><div>hello</div><div>another</div></body>');
            }
        },
        'with only tags defined in the included taglibs available': {
            topic: function() {
              ejs.render('<taglib src="includes" />' +
                         '<base-a />--<normal-a />--<normal-d />--<included-a />--<base-b />--<base-c />', {},
              this.callback)                        
            }, 
            'contains tags in base': function(err, buffer) {
              assert.includes(buffer.str, 'Base-A');
            },
            'no access to normally nested tag': function(err, buffer) {
              assert.includes(buffer.str, '<normal-a></normal-a>--<normal-d></normal-d>');
            },
            'access to included nested tag': function(err, buffer) {
              assert.includes(buffer.str, 'Included-A');
            },
            'base tag can access taglibs from where it is defined': function(err, buffer) {
              assert.includes(buffer.str, 'Base-B+Normal-C+Included-C');
              assert.includes(buffer.str, 'Base-C+Normal-B+Normal-D');
            },            
        },
        'can override tags defined in non-include taglibs': {
          topic: function() {
            ejs.render('<taglib src="includes" />' +
                       '<def tag="base-a">Local-Base-A</def>' +
                       '<span><base-a /></span><span><base-d /></span>', {},
            this.callback)                        
          }, 
          'uses redefined tag locally': function(err, buffer) {
            assert.includes(buffer.str, '<span>Local-Base-A</span>');
          },
          'uses original tag in original context': function(err, buffer) {
            assert.includes(buffer.str, '<span>Base-D+Base-A</span>');
          },          
        }
    },    
    'html': {
        'with simple attributes': {
            topic: ejs.render('<p class="two"><a href="someplace.html" title="something">Body Text</a></p>', {},
            this.callback),
            'return': function(buffer) {
                assert.equal(buffer.str, '<p class="two"><a href="someplace.html" title="something">Body Text</a></p>');
            }
        },
        'with ejs in attributes': {
            topic: function() {
                ejs.render('<p class="%{\'two\'}"><a href="someplace.html" title="%{\'some\' + \'thing\'}"><%= "Body " + "Text" %></a></p>', {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.equal(buffer.str, '<p class="two"><a href="someplace.html" title="something">Body Text</a></p>');
            }
        }
    },
    'options': {
        'make locals available nested': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><first><%= myLocal %></first><second><p><%= myLocal %></p></second><coinslot><%= myLocal %></coinslot><coinslot><p><%= myLocal %></p></coinslot><coinslot><coinslot><%= myLocal %></coinslot></coinslot>',
                {
                    locals: {
                        myLocal: "Here"
                    }
                },
                this.callback)
            },
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
        },
        'make globals available on buffer': {
          topic: function() {
              ejs.render('<p><%= buffer.globals.some %></p>',
              {
                  globals: {
                      'some': "global_variable"
                  }
              },
              this.callback)
          },
          'at first html level': function(err, buffer) {
              assert.includes(buffer.str, '<p>global_variable</p>');
          },          
        }
    },
    'pass context': {
        'from options.scope': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><first><%= this %></first><second><p><%= this %></p></second><coinslot><%= this %></coinslot><coinslot><p><%= this %></p></coinslot>',
                {
                    scope: "Here"
                },
                this.callback)
            },
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
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><p><witho obj="%{ someObj }">Print this:<%= this %></witho></p><p><witho obj="Yeah!">No, print this:<em><%= this %></em></witho></p><coinslot obj="%{ someObj }"><%= this %></coinslot><witho obj="%{ someObj }"><p><coinslot><%= this %></coinslot></p></witho><witho obj="%{ altObj }"><p><coinslot><witho obj="%{ falseObj }"><%= this %></witho></coinslot></p></witho>',
                {
                    locals: {
                        someObj: 'Yeah!',
                        altObj: 'Nooo!',
                        falseObj: false
                    }
                },
                this.callback)
            },
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
            'nested inside another tag with obj attribute': function(err, buffer) {
                assert.includes(buffer.str, '<p><div class="slot">false</div></p>');
            }
        },
        'with obj attribute on `with` tag': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><p><with obj="%{ someObj }">Print this:<%= this %></with></p><p><with obj="Yeah!">No, print this:<em><%= this %></em></with></p><coinslot obj="%{ someObj }"><%= this %></coinslot><with obj="%{ someObj }"><p><coinslot><%= this %></coinslot></p></with>',
                {
                    locals: {
                        someObj: 'Yeah!'
                    }
                },
                this.callback)
            },
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
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><div><print first="First" second="Second" third="Third">A tagbody.</print></div>', {},
                this.callback)
            },
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
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><div><uprint first="First" second="Second" third="Third">A tagbody.</uprint></div>', {},
                this.callback)
            },
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
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><div><print><attr:first>First</attr:first><attr:second>Second</attr:second><attr:third>Third</attr:third></print></div>',
                {},
                this.callback)
            },
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
    'pass attributes (by object)': {
        'which are defined': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><div><print attrs="%{ printAttrs }" second="2nd" third="Third">A tagbody.</print></div>',
                { 
                  locals: {
                    printAttrs: {
                      first: "First",
                      second: "Second"
                    }                    
                  }
                },
                this.callback)
            },
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
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><div><uprint attrs="%{ printAttrs }" second="2nd"><attr:third>Third</attr:third>A tagbody.</uprint></div>',
                { 
                  locals: {
                    printAttrs: {
                      first: "First",
                      second: "Second",
                      third: "Third"
                    }                    
                  }
                },                
                this.callback)
            },
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
    },    
    'asynchronous ejs': {
        'can be implemented in a defined tag': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><asyncto><p>Woohoo!</p></asyncto><asyncto><p><%? setTimeout(function(){ buffer.print("After"); buffer.end() }, 500) %></p></asyncto>',
                {
                    locals: {},
                    debug: false
                },
                this.callback)
            },
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
        'can call tagbody': {
            topic: function() {
                ejs.render('<def tag="after"><%? setTimeout(function(){ tagbody.call(this, buffer) }, 100) %></def><html><after>Print Me<% buffer.end() %></after></html>',
                {
                    locals: {},
                    debug: false
                },
                this.callback)
            },
            'from within a defined tag': function(err, buffer) {
                assert.includes(buffer.str, '<html>Print Me</html>');
            }
        },
        'can be called using `with` tag': {
            topic: function() {
                ejs.render('<html><with async="%{ setTimeout(function(){ withBody(\'a\', \'b\') }, 100) }" attrs="first,second">First: <%= first %><br/>Second: <%= second %><end/></with></html><with async="%{ setTimeout(function(){ withBody() }, 100) }"><%= buffer.globals.some %><end/></with>',
                {
                    locals: {},
                    debug: false,
                    globals: { 'some': 'global_variable' }
                },
                this.callback)
            },
            'mapping callback variables to defined attributes': function(err, buffer) {
                assert.includes(buffer.str, '<html>First: a<br/>Second: b</html>');
            },
            'with access to globals': function(err, buffer) {
                assert.includes(buffer.str, 'global_variable');
            }
        },
    },
    '`with` tag': {
        'defines attributes as variables': {
            topic: function() {
                ejs.render('<html><% var first = "z", third = "c" %><with attrs="first,second"><% first = "a"; %>First: <%= first %><br/>Second: <%= second %><br/>Third: <%= third %></with><br/>After: <%= first %></html>',
                {
                    locals: {},
                    debug: false
                },
                this.callback)
            },
            'only within the tag context': function(err, buffer) {
                assert.includes(buffer.str, 'First: a');
                assert.includes(buffer.str, 'After: z');
            },
            'and keeps parent context variables accessible': function(err, buffer) {
                assert.includes(buffer.str, 'Third: c');
            }            
        }
    },
    'attribute tags': {
        'can contain ejs': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><print><attr:first><p><%= "Some String" %></p></attr:first></print><print><attr:first><p><%? setTimeout(function(){ buffer.print("After"); buffer.end() }, 500) %></p></attr:first></print>',
                {
                    locals: {},
                    debug: false
                },
                this.callback)
            },
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
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><print first="%{ someStr }" /><witho obj="%{ someObj }"><div><print first="%{ this.str }"/></div><div><print><attr:first><%= this.alt %></attr:first></print></div></witho>',
                {
                    locals: {
                        someStr: "Here",
                        someObj: {
                            str: "New",
                            alt: "Alt"
                        }
                    },
                    debug: false
                },
                this.callback)
            },
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
    'attributes can be merged': {
        'to html tags for': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/>' +
                '<attr-html one="aah" two="bee" three="cee" four="dee" five="eee">All specified attrs</attr-html>' +
                '<attr-html-alt one="aah" two="bee" three="cee" four="dee" five="eee">All non-defined plus specified</attr-html-alt>' +
                '<attr-html-alt-alt one="aah" two="bee" three="cee" four="dee" five="eee">All non-defined plus specified</attr-html-alt-alt>',
                {
                    debug: false
                },
                this.callback)
            },
            'attributes specified only': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<div two="bee" four="dee">');
                }

            },
            'non-defined attributes plus specified only': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<div three="cee" four="dee" five="eee">');
                }
            },
            'all attributes': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<div one="aah" two="bee" three="cee" four="dee" five="eee">');
                }
            }
        },
        
        'from globals': {
          topic: function() {
              ejs.render('<def tag="global-merger" attrs="alwaysthere"><%= alwaysthere %></def><html><global-merger merge-globals="" /></html>',
              {
                  debug: false,
                  globals: {
                    alwaysthere: 'must_be_sonamed'
                  }
              },
              this.callback)
          },
          'for all matching globals': function(err, buffer) {
              if (err) {
                  throw err;
              } else {
                  assert.includes(buffer.str, '<html>must_be_sonamed</html>');
              }
          },          
        }
    },
    'class attributes can be merged': {
        'to tags from current tag context attributes': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/>' +
                '<class-tag class="button input">Blah</class-tag>', {},
                this.callback);
            },
            'with multiple classes': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<a class="button input blue disabled">Blah</a>');
                }
            }
        }
    },
    'must throw error': {
        'where tag names defined are standard html': {
            topic: function() {
                ejs.render('<def tag="something">Something</def><def tag="a"><a href="#"><tagbody/></a></def>', {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.ok(err);
            }
        },
        'where tag names defined used invalid characters': {
            topic: function() {
                ejs.render('<def tag="something">Something</def><def tag="_abc"><tagbody/></def>',
                {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.ok(err);
            }
        },
        'where tag names defined conflicts with reserved tag names': {
            topic: function() {
                ejs.render('<def tag="something">Something</def><def tag="tagbody"><tagbody/></def>',
                {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.ok(err);
            }
        },
        'where #{} encountered instead of %{}': {
            topic: function() {
                ejs.render('<a href="#{ [].join("") }">Blah</a>',
                {},
                this.callback)
            },
            'return': function(err, buffer) {
                assert.ok(err);
            }
        }        
    },
    'entities are escaped': {
        'in': {
            topic: function() {
                ejs.render('<p align="center">"Some" &lt; \'Any\'; None > &amp;</p>' +
                '<p oper="1 &gt; 1">Nevermind</p>' + 
                '<p atu="%{ \'Ben &amp; Jerry\' }">Boo!</p>' +
                '<p><%= \'Kenneth & Clark\' %></p>' + 
                '<p><%- _encode(\'Ben & Jerry\') %></p>',                 
                { encodeEntities: true },
                this.callback);
            },
            'text': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p align="center">&quot;Some&quot; &lt; &apos;Any&apos;; None &gt; &amp;</p>');
                }
            },
            'simple attributes': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p oper="1 &gt; 1">Nevermind</p>');
                }
            },
            'in ejs attribute': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p atu="Ben &amp; Jerry">Boo!</p>');
                }
            },
            'with standard equals output': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p>Kenneth &amp; Clark</p>');
                }
            },                      
            'with _encode() in ejs': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p>Ben &amp; Jerry</p>');
                }
            }                 
        }
    },
    'entities are not escaped': {
        'in': {
            topic: function() {
                ejs.render('<p align="center">"Some" &lt; \'Any\'; None > &amp;</p>' +
                '<p oper="1 &gt; 1">Nevermind</p>' + 
                '<p atu="%{ \'Ben &amp; Jerry\' }">Boo!</p>' +
                '<p><%= \'Kenneth & Clark\' %></p>' + 
                '<p><%- _encode(\'Ben & Jerry\') %></p>',                 
                { encodeEntities: false },
                this.callback);
            },
            'text': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p align="center">"Some" < \'Any\'; None > &</p>');
                }
            },
            'simple attributes': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p oper="1 &gt; 1">Nevermind</p>');
                }
            },
            'in ejs attribute': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p atu="Ben &amp; Jerry">Boo!</p>');
                }
            },
            'with standard equals output': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p>Kenneth & Clark</p>');
                }
            },                      
            'with _encode() in ejs': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<p>Ben &amp; Jerry</p>');
                }
            }                 
        }
    },    
    'namespaced tag': {
        'in same taglib as similarly named tag': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><body><x:namespaced /></body>', {},
                this.callback)
            },
            'should return the right body': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<h1>X</h1>');
                }
            }                     
        },
        'in same taglib as another similarly named tag': {
            topic: function() {
                ejs.render('<taglib src="simple.taglib"/><body><y:namespaced /></body>', {},
                this.callback)
            },
            'should return the right body': function(err, buffer) {
                if (err) {
                    throw err;
                } else {
                    assert.includes(buffer.str, '<h1>Y</h1>');
                }
            }                     
        }        
    },        
}).export(module);