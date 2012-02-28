0.3.1 / 2012-02-28
==================

  * Fixed issue #1: When obj evaluates to false, parent object is used
  
0.3.0 / 2012-01-21
==================

  * Updated to be compatible with Node 0.6+

0.2.3 / 2011-10-25
==================

  * By default encode entities in <%= %> tags, use <%- %> to skip encoding

0.2.2 / 2011-10-25
==================

  * Added namespacing of tags

0.2.1 / 2011-09-29
==================

  * Enable custom prefix on Buffer.newFieldId()
  * Catch and amend errors with failing source on function compile
  * Enable unclosed tags for output (input still needs to conform to XML)

0.2.0 / 2011-09-23
==================

  * Fixed issues related to core tags `if` and `else`
  * Changed core tag `repeat` to use underscore.js
  * Exposed renderFunctions to allow insertion of global view functions/helpers
  
0.1.15 / 2011-03-24
===================

  * NPM, Node and express compatibility updates

0.1.14 / 2011-03-24
===================
 
  * Buffer replacements:
    - repeated to maximum async buffer depth, dynamic
    - replace all instances, not only the first  
  * Fix: `withBody` lost scope when called from asynchronous callback
  * `repeat` tag can map keys and values from objects in an array
  
0.1.13 / 2011-03-22
===================

  * `with` tag can map asynchronous callback variables to tagbody context
  
0.1.12 / 2011-03-21
===================

  * Fixed multiple calls of rendering callback
  * Allow asynchronous callback of tagbody
  * TODO: `repeat` tag must ignore inherited properties on objects
  
0.1.11 / 2011-03-11
===================

  * Compatible with latest version of Express
  
0.1.10 / 2011-03-11
===================

  * Fixed case of `require('JS-Entities')`
  
0.1.9 / 2011-03-11 
==================

  * Updated package.json for latest npm version
  * Regenerated API docs

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