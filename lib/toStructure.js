/**
 * Module dependencies.
 */
var util = require('util'),
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
util.inherits(ParserError, Error);

/**
 * Reformat EJS tags to be correctly parsed (escaped) and wrap in document tag
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
function prepareString(str) {
    var r = new RegExp(/(\<\%)([^\x00]*?)(?=\%\>)/g);
    str = str.replace(r, function(x, y, z){
        return y + escape(z);
    });

    // var o = new RegExp(/("\%\{)(.*?)(?=\}\%")/g);
    // str = str.replace(o, function(x, y, z){
    //     return y + escape(z);
    // });
    
    var d = new RegExp(/(\"%\{)(.*?)(\}\")|(\'%\{)(.*?)(\}\')/g);
    str = str.replace(d, function(w, x, y, z, a, b, c, d, e, f){
        var opening = x || a || d,
            body = y || b || e,
            closing = z || c || f;
            
        return opening + escape(body) + closing;
    })    
    
    str = '<document>' + str.replace(/\<\%/g, "<% ejs=\"").replace(/\%\>/g, "\" />") + '</document>';
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
    str = prepareString(str);
    var stack = [{
        children: []
    }],
    parser = new xml.SaxParser(function(cb) {
        function onCharacters(chars, encoded) {
            chars = (options.trimWhitespace) ? chars.trim() : chars;
            if (chars.length > 0) {
                stack[stack.length - 1].children.push({
                    type: 'text',
                    content: chars,
                    line: parser.getLineNumber(),
                    column: parser.getColumnNumber(),
                    encoded: encoded
                });
            }
        }
        cb.onStartDocument(function() {
            // Ignore
            });
        cb.onEndDocument(function() {
            callback(null, stack[0].children[0].children);
        });
        cb.onStartElementNS(function(elem, attrs, prefix) {
            var attributes = {};
            if (elem == '%') {
                attributes['ejs'] = unescape(attrs[0][1]);
            } else {
                for (var attr in attrs) {
                    var value = attrs[attr][1];
                    if (value[value.length - 1] == '}' && value.indexOf('%{') === 0) {
                        value = unescape(value);
                    }
                    attributes[attrs[attr][0]] = value;
                }
            }
            current = {
                element: elem,
                type: 'tag',
                attrs: attributes,
                prefix: prefix,
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
        cb.onCharacters(onCharacters);
        cb.onCdata(function(chars) {
            onCharacters(chars, true);
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
                description = '\n    at ' + stack[stack.length - 1].element + ' (' + filename + parser.getLineNumber() + ':' + parser.getColumnNumber() + ')';
            var err = new Error(msg.replace(':', ''));
            err.stack = err.stack.replace('\n    at', description + '\n    at');
            callback(err);
        });
    });

    parser.parseString(str);
}