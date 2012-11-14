/**
 * Module dependencies.
 */
var fs = require('fs'),
    toStructure = require('./toStructure'),
    toFunctionSource = require('./toFunctionSource'),
    Buffer = require('./buffer'),
    renderFunctions = exports.renderFunctions = require('./renderFunctions'),
    isValidTagname = require('./isValidName').isValidTagname,
    isValidAttributename = require('./isValidName').isValidAttributename,
    _ = require('underscore')
    cache = {};

/**
 * Defaults
 */
exports.root = process.cwd() + '/views';
exports.ext = 'dryml';
exports.version = "0.4.3";
exports.cache = true;
exports.encodeEntities = true;

/**
 * Determine actual file path for specific view file
 *
 * @param {String} view
 * @param {String} root
 * @return {String}
 * @api public
 */
function realPath(view, root) {
    var returnPath = (view[0] == '/') ? view: fs.realpathSync((root || exports.root) + '/' + view + '.' + exports.ext);
    return returnPath;
}

/**
 * Render DRYML string to a buffer
 *
 * @param {String} str
 * @param {Object} options
 * @param {Object} callback
 * @return {Object}
 * @api public
 */
var render = exports.render = function(str, options, callback) {
    var path,
        compiled,
        buffer = Buffer(callback);

    try {
        options = options || {};
        options.locals = options.locals || {};
        options.cache = (options.cache === null || typeof(options.cache) == 'undefined') ? exports.cache : options.cache;        
        options.encodeEntities = (options.encodeEntities == null) ? exports.encodeEntities : options.encodeEntities;
        options.str = options.str || str;

        buffer.globals = options.globals || {};

        if (options.filename && options.filename.indexOf('/') > 0) {
            var lastSlashIndex = options.filename.lastIndexOf('/');
            options.root = exports.root + '/' + options.filename.slice(0, lastSlashIndex);
            options.filename = options.filename.slice(lastSlashIndex + 1);
        } else {
            options.root = exports.root;
        }
        var context = options.scope || {};

        if (options.debug || options.cache != true) {
            cache = {};
        }

        if (!options.str && options.filename) {
            path = options.filepath = realPath(options.filename, options.root);
            // Use cached if available, otherwise compile
            compiled = cache[path];
            if (!compiled) {
                if (options.debug) console.log('Compiling view at: ' + path);
                if (!options.str) {
                    options.str = '' + fs.readFileSync(path);
                }
                compile(options.str, options,
                function(err, compiled) {
                    if (err) {
                        callback(err);
                    } else {                    
                        try {
                            cache[path] = compiled;
                            compiled.fn(context, compiled.taglib, options.locals, buffer);
                        } catch(err) {
                            buffer.error(err);
                        }
                    }
                });
            } else {
                compiled.fn(context, compiled.taglib, options.locals, buffer);
            }
        } else {
            compile(options.str, options,
            function(err, compiled) {
                if (err) {
                    buffer.error(err);
                } else {
                    try {
                        compiled.fn(context, compiled.taglib, options.locals, buffer);
                    } catch(err) {
                        buffer.error(err);
                    }                    
                }
            });
        }
    } catch(err) {
        buffer.error(err);
    }
    return buffer;
};

/**
 * Render view to the given response (Express)
 *
 * @param {String} view
 * @param {Object} options
 * @param {Object} response
 * @api public
 */
var renderView = exports.renderView = function(view, options, response) {
    options = options || {};
    options.filename = view;
    var callback = (_.isFunction(response)) ? response :
    function(err, buffer) {
        if (err) {
            response.req.next(err);
        } else {
            if (options.debug) console.log(buffer.str);            
            response.send(buffer.str, options.headers);
        }
    };
    
    render(null, options, callback);
};

/**
 * Compile the given dryml string into an object with function with compiled taglibs
 *
 * @param {String} str
 * @param {String} type
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
var compile = exports.compile = function(str, options, callback) {
    var type = (options.taglib) ? 'taglib' : 'page';
    // Convert string to structure
    toStructure(str, options,
    function(err, structure) {
        if (err) { 
            callback(err);
        } else {
            if (type == 'page') {
                // Inject core taglib
                var corePath = realPath('core', __dirname + '/support');
                structure.unshift({
                    type: "tag",
                    element: "taglib",
                    attrs: {
                        src: corePath,
                        include: true,
                        core: true
                    }
                });
            }
            // Import all taglibs and definitions in structure into this taglib
            importTaglibs({},
              structure, options,
              function(err, taglib) {
                  if (err) {
                      callback(err);
                  } else {
                      if (type == 'page') {
                          // Parse rest of file for buffer output and compile into function
                          var source = toFunctionSource(structure, 'page', options),
                              fn;
                          try {
                            fn = new Function('locals, taglib, buffer, _renderFunctions', source);
                          } catch (err) {
                            err.source = source;
                            throw(err);
                          }
                          if (options.debug) {
                              console.log('-- Debug:');
                              console.log(JSON.stringify(structure, null, '  '));
                              console.log(source);
                              console.log(JSON.stringify(taglib, null, '  '));
                              console.log('--');
                          }

                          callback(null, {
                              fn: function(context, taglib, locals, buffer) {
                                  fn.call(context, locals, taglib, buffer, renderFunctions);
                              },
                              taglib: taglib
                          });
                      } else {
                          callback(null, {
                              fn: function() {},
                              taglib: taglib
                          });
                      }
                  }
              });
        }
    });
};

/** 
 * Create a new compilation error with filename 
 *
 * @param {String} message
 * @param {String} tagName
 * @param {Number} line
 * @param {Number} column   
 * @param {String} filename
 * @return {Error}
 * @api private
 */
function newCompilationError(message, tagName, line, column, filename) {
    var filename = (filename) ? filename + ':': '',
        description = '\n    at ' + tagName + ' (' + filename + line + ':' + column + ')';
    var err = new Error(message.replace(':', ''));
    err.stack = err.stack.replace('\n    at', description + '\n    at');
    return err;
}

/**
 * Compile a given tag into an object with function
 *
 * @param {Object} forTaglib
 * @param {Object} tag
 * @param {Object} options
 * @return {Object}
 * @api private
 */
function compileTag(forTaglib, tag, options) {
    if (tag.children) {   
             
        var attrs = (tag.attrs.attrs) ? tag.attrs.attrs.replace(/\s/, '').split(',') : [];        
        for (var i in attrs) {
            if (!isValidAttributename(attrs[i])) {
                throw newCompilationError('Invalid attribute definition \'' + attrs[i] + '\'', tag.element, tag.line, tag.column, options.filepath);
            }
        }
        var source = toFunctionSource(tag.children, 'definition', options),
            fn;
            
        try {
            fn = new Function('context, attributes, taglib, buffer, tagbody, _renderFunctions, sup', source);
        } catch(err) {
            throw newCompilationError(err.message, tag.element, tag.line, tag.column, options.filepath);
        }
        return {
            source: source,
            fn: function(context, attributes, taglib, buffer, callback, sup) {
                fn.call(this, context, attributes, (options.includeAllTaglibs) ? taglib : forTaglib, buffer, callback, renderFunctions, sup);
            },
            attributes: attrs,            
        };
    } else if (tag.attrs.alias) {
        return forTaglib[tag.attrs.alias];
    } else {
        return null;
    }
}


function importTaglib(filename, options, callback) {
    var path = realPath(filename, options.root);
    var compiled = cache[path];
    if (!compiled) {
        var str = '' + fs.readFileSync(path),
        root = path.slice(0, path.lastIndexOf('/'));
        var newOptions = {
            filename: filename,
            filepath: path,
            root: root,
            cache: options.cache,
            debug: options.debug,
            encodeEntities: options.encodeEntities,
            trimWhitespace: options.trimWhitespace,
            includeAllTaglibs: options.includeAllTaglibs,
            taglib: true
        }        
        compile(str, newOptions,
        function(err, compiled) {
            if (err) {
                callback(err);
            } else {
                compiled.taglib._filepath = newOptions.filepath;
                cache[path] = compiled;
                callback(null, compiled.taglib);                
            }
        });
    } else {
        callback(null, compiled.taglib);
    }
}

function importTaglibs(taglib, structure, options, callback) {
    var self = {
        taglib: taglib,
        structure: structure,
        index: -1,
        defs: [],
        next: function() {
            self.index += 1;
            var element = self.structure[self.index];
            if (element) {
                if (element.type == 'tag') {
                    switch (element.element) {
                    case 'taglib':
                        if (element.attrs.src) {
                            importTaglib(element.attrs.src, options,
                            function(err, newTaglib) {
                                if (err) {
                                    callback(err);
                                } else {
                                    if (element.attrs.core == true) {
                                      cache['core'] = newTaglib;
                                    } else {
                                      newTaglib._core = cache['core'];
                                    }

                                    mergeIntoTaglib(self.taglib, newTaglib, element, options);                                      
                                    self.next();
                                }
                            });
                        }
                        break;
                    case 'def':
                        if (element.attrs.tag) {
                            if (element.prefix || isValidTagname(element.attrs.tag)) {
                                var tagName = (element.prefix) ? element.prefix + ':' + element.attrs.tag : element.attrs.tag;
                                try {
                                    newTaglib = { _filepath: options.filepath };
                                    newTaglib[tagName] = compileTag(taglib, element, options);
                                    mergeIntoTaglib(self.taglib, newTaglib, element, options);
                                    self.next();                                    
                                } catch(err) {
                                    callback(err);
                                }
                            } else {
                                callback(newCompilationError("Invalid tag name '" + element.attrs.tag + "'", element.element, element.line, element.column, options.filepath));
                            }
                        }
                        break;
                    default:
                        // Ignore
                        self.next();
                        break;
                    }
                } else {
                    self.next();
                }
            } else {
                callback(null, self.taglib);
            }
        }
    };
    self.next();
}

var TRUE_VALUES = ['true', 'TRUE', '1', 1, true, 'yes'];

function mergeIntoTaglib(taglib, newTaglib, atTag, options) {
    if (!taglib._filepaths) { taglib._filepaths = []; }
    if (!taglib._notExported) { taglib._notExported = {}; }

    // Export for all def tags, and only for taglibs with attr include="true"
    var mustExport = options.includeAllTaglibs || atTag.element == 'def' || (atTag.attrs.include && TRUE_VALUES.indexOf(atTag.attrs.include) > -1);
        
    var included = (taglib._filepaths.indexOf(newTaglib._filepath) > -1);
    
    for (var name in newTaglib) {
        if (name[0] != '_') {
            var existing = taglib[name] || (!mustExport && (taglib._core && taglib._core[name]));// || taglib._notExported && taglib._notExported[name])),
                current = newTaglib[name];

            if (existing && !included) {
                // TODO: Wrap with previously declared function as sup
                // taglib[name] = function(context, attributes, buffer, callback, sup) {
                //  currentFunction.call(context, attributes, buffer, callback, existingFunction);
                // }
                
                throw newCompilationError('Tag already defined \'' + name + '\'', atTag.element, atTag.line, atTag.column, (options) ? options.filepath : null);
            } else if (mustExport) {
                taglib[name] = current;
            } else {
                taglib._notExported[name] = current;
            }
        }
    }    
    if (newTaglib._filepaths) { taglib._filepaths.concat(newTaglib._filepaths) };    
    taglib._filepaths.push(newTaglib._filepath);
    return taglib;
}

