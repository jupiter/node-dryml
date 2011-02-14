/**
 * Module dependencies.
 */
var fs = require('fs'),
	toStructure = require('./toStructure'),
	toFunctionSource = require('./toFunctionSource'),
	Buffer = require('./buffer'),
	renderFunctions = require('./renderFunctions'),
    cache = {};

/**
 * Defaults
 */
exports.root = process.cwd() + '/views';
exports.ext = 'dryml';

/**
 * Determine actual file path for specific view file
 *
 * @param {String} view
 * @param {String} root
 * @return {String}
 * @api public
 */
function realPath(view, root) {
	return fs.realpathSync((root || exports.root) + '/' + view + '.' + exports.ext);
}

/**
 * Render string to a buffer
 *
 * @param {String} str
 * @param {Object} options
 * @param {Object} callback
 * @return {Object}
 * @api public
 */
var render = exports.render = function(str, options, callback) {
	var compiled,
		buffer = Buffer(callback);
		
	options = options || {};
	options.locals = options.locals || {};
	options.str = options.str || str;
	options.root = (options.filename && options.filename.indexOf('/') > 0) ? options.filename.slice(0, options.filename.lastIndexOf('/')) : exports.root;
 
	var context = options.scope || {};

	if (options.filename && !options.debug) {
		var path = realPath(options.filename, options.root);
		// Use cached if available, otherwise compile
		compiled = cache[path];
		if (!compiled) {
			if (options.debug) console.log('Compiling view at: ' + path);
			if (!options.str) {
				var path = realPath(options.filename, options.root);
				options.str = '' + fs.readFileSync(path);
			}
			compile(options.str, 'page', options, function(compiled){
				cache[path] = compiled;
				compiled.function(context, compiled.taglib, options.locals, buffer);				
			})
		} else {
			compiled.function(context, compiled.taglib, options.locals, buffer);
		}		
	} else {
		if (!options.str) {
			var path = realPath(options.filename, options.root);
			options.str = '' + fs.readFileSync(path);
		}
		compile(options.str, 'page', options, function(compiled){
			compiled.function(context, compiled.taglib, options.locals, buffer);				
		})
	}	
	return buffer;
}

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
	render(null, options, function(err, buffer){
		if (options.debug) console.log(buffer.str);
		response.send(buffer.str);
	})
}

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
	toStructure(str, options, function(structure){
		// Import all taglibs and definitions in structure into this taglib
		importTaglibs({}, structure, options, function(taglib){
			if (type == 'page') {	
				// Parse rest of file for buffer output and compile into function
				var source = toFunctionSource(structure, 'page', options),
					fn = new Function('locals, taglib, buffer, _renderFunctions', source);

				if (options.debug) {
					console.log('-- Debug:')
					console.log(JSON.stringify(structure, null, '  '));
					console.log(source);
					console.log(JSON.stringify(taglib, null, '  '));
					console.log('--');
				}
			
				callback({ function: function(context, taglib, locals, buffer){ 
							fn.call(context, locals, taglib, buffer, renderFunctions);
						}, taglib: taglib });
			} else {
				callback({ function: function(){}, taglib: taglib});
			}		
		});
	});
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
var compileTag = function(forTaglib, tag, options) {				
	if (tag.children) {
		var source = toFunctionSource(tag.children, 'definition', options), fn;
		try {
			fn = new Function('context, attributes, taglib, buffer, callback, _renderFunctions, super', source);
		} catch(err) {
			console.log(source);
			throw err;
		}
		return {
			source: source,
			function: function(context, attributes, taglib, buffer, callback, super){
		        fn.call(this, context, attributes, taglib, buffer, callback, renderFunctions, super);
		    },
			attributes: (tag.attrs.attrs) ? tag.attrs.attrs.split(',') : []
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
		compile(str, 'taglib', { filename: filename, root: root, trimWhitespace: options.trimWhitespace }, function(compiled) {
			cache[path] = compiled;
			callback(compiled.taglib);
		});
	} else {
		callback(compiled.taglib);
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
								importTaglib(element.attrs.src, options, function(newTaglib){
									mergeIntoTaglib(self.taglib, newTaglib);
									self.next();
								})						
							}
						break;
						case 'def':
							if (element.attrs.tag) {
								newTaglib = {}
								newTaglib[element.attrs.tag] = compileTag(taglib, element, options);
								mergeIntoTaglib(self.taglib, newTaglib);
								self.next();
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
				callback(self.taglib);
			}
		}
	};
	self.next();
}

function mergeIntoTaglib(taglib, current, options) {
	for (var name in current) {
		var existingFunction = taglib[name],
			currentFunction = current[name];
		if (existingFunction) {
			// TODO: Wrap with previously declared function as super				
			// taglib[name] = function(context, attributes, buffer, callback, super) {
			// 	currentFunction.call(context, attributes, buffer, callback, existingFunction);
			// }
			throw new Error('Tag already defined <' + name + '>');
		} else {
			taglib[name] = currentFunction;
		}			
	}
	return taglib;
}

