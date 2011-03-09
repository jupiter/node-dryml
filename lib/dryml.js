/**
 * Module dependencies.
 */
var fs = require('fs'),
    toStructure = require('./toStructure'),
    toFunctionSource = require('./toFunctionSource'),
    Buffer = require('./buffer'),
    renderFunctions = require('./renderFunctions'),
    isValidTagname = require('./isValidName').isValidTagname,
    isValidAttributename = require('./isValidName').isValidAttributename,
    cache = {};

/**
 * Defaults
 */
exports.root = process.cwd() + '/views';
exports.ext = 'dryml';
exports.version = "0.1.5";
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
        options.encodeEntities = (options.encodeEntities === null || typeof(options.encodeEntities) == 'undefined') ? exports.encodeEntities : options.encodeEntities;
        options.str = options.str || str;
        if (options.filename && options.filename.indexOf('/') > 0) {
            var lastSlashIndex = options.filename.lastIndexOf('/');
            options.root = exports.root + '/' + options.filename.slice(0, lastSlashIndex);
            options.filename = options.filename.slice(lastSlashIndex + 1);
        } else {
            options.root = exports.root;
        }
        var context = options.scope || {};

        if (options.debug || options.cache === true) {
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
                compile(options.str, 'page', options,
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
            compile(options.str, 'page', options,
            function(err, compiled) {
                if (err) {
                    callback(err);
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
    render(null, options, (typeof(response) == 'function') ? response :
    function(err, buffer) {
        if (err) {
            response.req.next(err);
        } else {
            if (options.debug) console.log(buffer.str);            
            response.send(buffer.str);
        }
    });
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
var compile = exports.compile = function(str, type, options, callback) {
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
                        src: corePath
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
                            fn = new Function('locals, taglib, buffer, _renderFunctions', source);

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
                throw newCompilationError('Invalid attribute defintion \'' + attrs[i] + '\'', tag.element, tag.line, tag.column, options.filepath);
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
                fn.call(this, context, attributes, taglib, buffer, callback, renderFunctions, sup);
            },
            attributes: attrs
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
            trimWhitespace: options.trimWhitespace
        }        
        compile(str, 'taglib', newOptions,
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
                                    mergeIntoTaglib(self.taglib, newTaglib, element, options);
                                    self.next();
                                }
                            });
                        }
                        break;
                    case 'def':
                        if (element.attrs.tag) {
                            if (isValidTagname(element.attrs.tag)) {
                                newTaglib = { _filepath: options.filepath };
                                newTaglib[element.attrs.tag] = compileTag(taglib, element, options);
                                mergeIntoTaglib(self.taglib, newTaglib, element, options);
                                self.next();
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

function mergeIntoTaglib(taglib, newTaglib, atTag, options) {
    if (!taglib._filepaths) { taglib._filepaths = []; }
        
    var included = (taglib._filepaths.indexOf(newTaglib._filepath) > -1);
    for (var name in newTaglib) {
        if (name[0] != '_') {
            var existing = taglib[name],
                current = newTaglib[name];

            if (existing && !included) {
                // TODO: Wrap with previously declared function as sup
                // taglib[name] = function(context, attributes, buffer, callback, sup) {
                //  currentFunction.call(context, attributes, buffer, callback, existingFunction);
                // }
                
                throw newCompilationError('Tag already defined \'' + name + '\'', atTag.element, atTag.line, atTag.column, (options) ? options.filepath : null);
            } else {
                taglib[name] = current;
            }            
        }
    }
    if (newTaglib._filepaths) { taglib._filepaths.concat(newTaglib._filepaths) };    
    taglib._filepaths.push(newTaglib._filepath);
    return taglib;
}

