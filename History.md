0.1.6 / 2011-02-26 
==================

  * Attribute inheritance/merging with `merge-attrs=""` for all, `merge-attrs="name"` for named attributes
  * Changed `callback` to `tagbody` to use in by `tagbody.call(this)` in EJS
  * TODO: Express error integration
  
0.1.5 / 2011-02-23 
==================

  * Added `cache` option to turn off cache
  * Fixed parsing of EJS with reserved characters
  * Core Taglib: Added object support for repeat tag
  
0.1.4 / 2011-02-17 
==================

  * Some JSLint improvements, reformatting
  * Readme fix: `function(buffer)` should be `function(err, buffer)`
  
0.1.3 / 2011-02-15 
==================

  * Validate tag names upon definition
  * Added first core tags incl. if/else, repeat
  
0.1.2 / 2011-02-15 
==================

  * Added API documentation
  * Ensure dependencies work in package.json
  * Published to npm