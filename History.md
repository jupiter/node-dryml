0.1.8 / 2011-03-04 
==================

  * Specific self-closing tags
  * Fixed embedded if/else tags
  * Use shallow copy for locals/attribute inheritance
  * Restrict defined attribute names to exclude reserved words and invalid formats
  * Same taglib can be included multiple times without conflict
  * Fixed some errors that weren't caught
  * Merge `class` attribute
  * Detect and warn on `%{}` in attribute
  * Encode HTML entities for all text and attributes, and use in free EJS using `_encode(str)`
  
0.1.7 / 2011-03-02 
==================

  * Fixed elative paths from root
  * Allow script/style/etc. tag content within `<![CDATA[` `]]>` tag
  
0.1.6 / 2011-02-26 
==================

  * Attribute inheritance/merging with `merge-attrs=""` for all, `merge-attrs="name"` for named attributes
  * Changed `callback` to `tagbody` to use in by `tagbody.call(this)` in EJS
  * Better express error integration
  * Added underscore library to use in views
  
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