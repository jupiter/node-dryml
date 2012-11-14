0.4.11 / 2012-11-14
==================
  * Fix entities not encoded in taglibs
  
0.4.10 / 2012-10-31
==================
  * Replace &apos; with &#39; for IE
  * Remove unused dependency
  
0.4.9 / 2012-10-24
==================
  * Return original errors (to be able to detect err.code == 'ENOENT')
  
0.4.8 / 2012-10-16
==================
  * Fix `<textarea />` breaks

0.4.6 / 2012-07-26
==================

  * Minor performance improvements
  * Async buffers that are not really async returns contents immediately,
    e.g. child tag attributes processed using an async buffer:
      contents of a child tag attribute is already set within contents of tag
  
0.4.5 / 2012-06-15
==================

  * Added #4: Should be able to omit empty attributes
  * Fixed #5: Javascript within `<% %>` block should not require entities
  
0.4.4 / 2012-05-22
==================

  * Fix new entities library not handling non-strings
  
0.4.3 / 2012-05-21
==================

  * Fix entities in attr tags being re-encoded/encoded twice
  * Use new entities library for better entity encoding/decoding
  
0.4.2 / 2012-05-20
==================

  * Allow unencoded special characters within ejs in attributes
  * Add slashes rather than escape strings in function source
  * Fix core tag 'else' should test negative if `null` passed, but positive if no value passed

0.4.1 / 2012-05-18
==================

  * Ignore conflicts between included taglibs
  * Fix core tags to be available multiple include levels up
  
0.4.0 / 2012-05-18
==================

  * Taglibs will not conflict and included tags are not exported by default

0.3.3 / 2012-05-18
==================

  * Added support for passing attributes with an object, 
    e.g `<a attrs="%{ linkAttrs }">Back</a>`, where `linkAttrs = { href: '#' }`
  * Added switch/case/default tags, e.g.
    
    ```
      <switch test="#{ testValue }">
        <case test="a">A</case>
        <case test="b"><span>B</span></case>
        <default><span class="empty"></span></default>
      </switch>
    ```
    
0.3.2 / 2012-03-05
==================

  * Added support for merging options.globals using a 'merge-globals'
    attribute, that works in the same way as 'merge-attrs'

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