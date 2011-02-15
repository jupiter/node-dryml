/**
 * Module dependencies.
 */
var sys = require('sys'),
fs = require('fs'),
xml = require("node-xml");

/**
 * ParserError
 *
 * @param {String} message
 * @return {String}
 * @api private
 */
function ParserError(msg) {
    this.name = 'Parser Error';
    Error.call(this, msg);
    // Error.captureStackTrace(this, arguments.callee);
}
sys.inherits(ParserError, Error);

/**
 * Reformat EJS tags to be correctly parsed and wrap in document tag
 *
 * @param {String} str
 * @param {String} quotesReplacement
 * @return {String}
 * @api private
 */
function prepareString(str, quotesReplacement) {
    var r = new RegExp(/(\<\%[^\"\%]*)(\")/g),
	    e = new RegExp(/\<\%[^\"\%]*\"[^\%]*\%\>/g),
	    m = '$1' + quotesReplacement;
    while (str.match(e)) {
        str = str.replace(r, m);
    }
    str = '<document>' + str.replace(/\<\%/g, "<% ejs=\"").replace(/\%\>/g, "\"/>").replace(/\&/g, '&amp;') + '</document>';
	return str;
}

/**
 * Use XML parser to convert into object structure
 *
 * @param {String} str
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
module.exports = function(str, options, callback) {
	str = prepareString(str, '§');
    var stack = [{
        children: []
    }],
    parser = new xml.SaxParser(function(cb) {
        cb.onStartDocument(function() {
            // Ignore
            });
        cb.onEndDocument(function() {
            callback(stack[0].children[0].children);
        });
        cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
            var attributes = {};
			if (elem == '%') {
				attributes['ejs'] = attrs[0][1].replace(/§/g, '"');
			} else {
	            for (var attr in attrs) {
	                attributes[attrs[attr][0]] = attrs[attr][1];
	            }
			}
            current = {
                element: elem,
                type: 'tag',
                attrs: attributes,
                prefix: prefix,
                uri: uri,
                namespaces: namespaces,
                line: parser.getLineNumber(),
                column: parser.getColumnNumber(),
                children: []
            };
            stack.push(current);
        });
        cb.onEndElementNS(function(elem, prefix, uri) {
            var top = stack.pop();

            stack[stack.length - 1].children.push(top);
        });
        cb.onCharacters(function(chars) {
            chars = (options.trimWhitespace) ? chars.trim() : chars;
            if (chars.length > 0) {
                stack[stack.length - 1].children.push({
                    type: 'text',
                    content: chars,
                    line: parser.getLineNumber(),
                    column: parser.getColumnNumber(),
                });
            }
        });
        cb.onCdata(function(cdata) {
            // Ignore
            });
        cb.onComment(function(msg) {
            stack[stack.length - 1].children.push({
                type: 'comment',
                content: msg,
                line: parser.getLineNumber(),
                column: parser.getColumnNumber(),
            });
        });
        cb.onWarning(function(msg) {
            // Ignore
            });
        cb.onError(function(msg) {
            var filename = (options.filepath) ? options.filepath + ':': '',
            description = msg + '\n    at <' + stack[stack.length - 1].element + '> (' + filename + parser.getLineNumber() + ':' + parser.getColumnNumber() + ')';

			if (options.callbackErrors) {
	            callback([{
	                type: 'error',
	                description: description,
	                element: stack[stack.length - 1].element,
	                line: parser.getLineNumber(),
	                column: parser.getColumnNumber()
	            }]);				
			} else {
				throw new Error(description);
			}
        });
    });

    parser.parseString(str);
}