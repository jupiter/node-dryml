
// Run $ expresso

/**
 * Module dependencies.
 */

var app = require('./integration/app')
  , assert = require('assert');


module.exports = {
  'GET /': function(){
    assert.response(app,
      { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res){
        assert.includes(res.body, '<title>Express</title>');
		assert.includes(res.body, '<li><a href="/one">One</a></li>');
		assert.includes(res.body, '<li><a href="/three">Three</a></li>');
		assert.includes(res.body, '<div class="insert"><a href="#">Printed</a></div>');
		assert.includes(res.body, '<div id="right" class="highlight">');
      });
  },
  'GET / again': function(){
    assert.response(app,
      { url: '/' },
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }},
      function(res){
        assert.includes(res.body, '<title>Express</title>');
		assert.includes(res.body, '<li><a href="/one">One</a></li>');
		assert.includes(res.body, '<li><a href="/three">Three</a></li>');
		assert.includes(res.body, '<div class="insert"><a href="#">Printed</a></div>');
		assert.includes(res.body, '<div id="right" class="highlight">');
      });
  }
};