/**
 * Module dependencies.
 */
var _ = require('underscore');

/**
 * Buffer object
 *
 * @param {Object} callback
 * @return {Object}
 * @api public
 */
var Buffer = function(callback) {
    var self = {
        callback: (callback) ? callback: function() {},
        indexes: 0,
        count: 0,
        buffers: [],
        str: "",
        stackTrace: [],
        replacements: {},
        shouldEnd: false,
        ended: false,        
        fieldId: 9,
        lastIf: null,
        lastIfStack: [],
        trace: function(filename, tag, line, column) {
            self.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
        },
        exit: function() {
            self.stackTrace.pop();
        },        
        print: function(str, middleware) {
            if (str !== null) {
                self.str = self.str.concat((middleware) ? middleware(str) : str);
            }
        },
        async: function(scope, callback, trace) {
            var buffer = self;
            buffer.indexes++;
            buffer.count++;
            var index = buffer.indexes,
                replacementStr = '§B' + index + '§';
            
            if (trace) buffer.trace.apply(this, trace);
            var asyncBuffer = buffer[index] = {
                stackTrace: _.clone(buffer.stackTrace),
                str: "",
                lastIf: null,
                lastIfStack: [],                
                newFieldId: buffer.newFieldId,
                trace: function(filename, tag, line, column) {
                    asyncBuffer.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
                },
                exit: function() {
                    asyncBuffer.stackTrace.pop();
                },                
                print: function(str, middleware) {
                    if (str !== null) {                    
                        asyncBuffer.str = asyncBuffer.str.concat((middleware) ? middleware(str) : str);
                    }
                },
                end: function() {
                    buffer.replacements[replacementStr] = asyncBuffer.str;
                    buffer.count--;
                    if (buffer.shouldEnd) {
                        buffer.end();
                    }
                },
                async: function(scope, callback) {
                    return buffer.async(scope, callback);
                },
                error: function(err, errBuffer) {
                    buffer.error(err, errBuffer);
                },
                startIfContext: function() {
                    asyncBuffer.lastIfStack.push(asyncBuffer.lastIf);
                    asyncBuffer.lastIf = null;
                },
                endIfContext: function() {
                    asyncBuffer.lastIf = asyncBuffer.lastIfStack.pop();
                }
            };
            try {
                callback.call(scope, asyncBuffer);
            } catch(err) {
                asyncBuffer.error(err, asyncBuffer);
            }  
            if (trace) buffer.exit();              
            return replacementStr;
        },
        end: function() {
            if (self.count === 0) {
                for (var i = 0; i < 2; i++) {
                    for (var replacementStr in self.replacements) {
                        if (typeof(self.replacements[replacementStr]) == 'string') {
                            self.str = self.str.replace(replacementStr, self.replacements[replacementStr]);
                        }
                    }
                }
                self.str = self.str.replace(/\s*\n/g, "\n");
                if (!self.ended) {
                    self.ended = true;
                    self.callback(null, self);                
                }
            } else {
                self.shouldEnd = true;
            }
            return self.str;
        },
        error: function(err, errBuffer) {
            if (!errBuffer) errBuffer = self;
            err = new Error(err.message);
            err.stack = err.stack.replace('\n    at',  '\n    ' + errBuffer.stackTrace.slice( - 5).reverse().join('\n    ') + '\n    at');
            if (!self.ended) {
                self.ended = true;
                self.callback(err, self);                
            }
        },
        newFieldId: function() {
            self.fieldId += 1;
            return 'field-' + self.fieldId.toString(16);;
        },
        startIfContext: function() {
            self.lastIfStack.push(self.lastIf);
            self.lastIf = null;
        },
        endIfContext: function() {
            self.lastIf = self.lastIfStack.pop();
        }       
    };
    return self;
};

module.exports = Buffer;