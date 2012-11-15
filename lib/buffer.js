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
var DrymlBuffer = function(callback) {
    var self = {
        callback: (callback) ? callback: function() {},
        indexes: 0,
        count: 0,
        depth: 1,
        buffers: [],
        str: "",
        stackTrace: [],
        replacements: {},
        shouldEnd: false,
        ended: false,        
        fieldId: 9,
        lastIf: null,
        lastIfStack: [],
        lastSwitch: null,
        lastSwitchStack: [],        
        trace: function(filename, tag, line, column) {
            self.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
        },
        exit: function() {
            self.stackTrace.pop();
        },        
        print: function(str, middleware) {
            if (str !== null && str !== undefined) {
                self.str += ((middleware) ? middleware(str) : str);
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
                ended: false,
                str: "",
                lastIf: null,
                lastIfStack: [],        
                lastSwitch: null,
                lastSwitchStack: [],        
                lastIfStack: [],     
                globals: buffer.globals,           
                newFieldId: buffer.newFieldId,
                trace: function(filename, tag, line, column) {
                    asyncBuffer.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
                },
                exit: function() {
                    asyncBuffer.stackTrace.pop();
                },                
                print: function(str, middleware) {
                    if (str !== null && str !== undefined) {                    
                        asyncBuffer.str += ((middleware) ? middleware(str) : str);
                    }
                },
                end: function() {
                    buffer.replacements[replacementStr] = asyncBuffer.str;
                    asyncBuffer.ended = true;
                    buffer.count--;
                    if (buffer.shouldEnd) {
                        buffer.end();
                    }
                },
                async: function(scope, callback) {
                    buffer.depth = buffer.depth + 1;
                    return buffer.async(scope, callback);
                },
                error: function(err, errBuffer) {
                    buffer.error(err, errBuffer);
                },
                startIfContext: function() {
                    asyncBuffer.lastIfStack.push(asyncBuffer.lastIf);
                    asyncBuffer.lastIf = null;
                    asyncBuffer.lastSwitchStack.push(asyncBuffer.lastSwitch);
                    asyncBuffer.lastSwitch = null;
                },
                endIfContext: function() {
                    asyncBuffer.lastIf = asyncBuffer.lastIfStack.pop();
                    asyncBuffer.lastSwitch = asyncBuffer.lastSwitchStack.pop();
                },                
            };
            try {
                callback.call(scope, asyncBuffer);
            } catch(err) {
                asyncBuffer.error(err, asyncBuffer);
            }  
            if (trace) buffer.exit();
            
            if (asyncBuffer.ended) {
              // If it wasn't async, i.e. buffer has already ended when it gets here             
              delete(buffer.replacements[replacementStr]);
              return new Buffer(asyncBuffer.str);
            } else {
              return new Buffer(replacementStr);
            }   
        },
        end: function() {
            if (self.count === 0) {
                for (var i = 0; i < self.depth; i++) {
                    for (var replacementStr in self.replacements) {
                        if (typeof(self.replacements[replacementStr]) == 'string') {
                            self.str = self.str.replace(new RegExp(replacementStr, 'g'), self.replacements[replacementStr]);
                        }
                    }
                }
                // Vanity nl compaction breaks textareas
                // self.str = self.str.replace(/\s*\n/g, "\n");
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
            // err = new Error(err.message); Return original error
            err.stack = err.stack.replace('\n    at',  '\n    ' + errBuffer.stackTrace.slice( - 5).reverse().join('\n    ') + '\n    at');
            if (!self.ended) {
                self.ended = true;
                self.callback(err, self);                
            }
        },
        newFieldId: function(prefix) {
            prefix = prefix || 'field';
            self.fieldId += 1;
            return prefix + '-' + self.fieldId.toString(16);;
        },
        startIfContext: function() {
            self.lastIfStack.push(self.lastIf);
            self.lastIf = null;
            self.lastSwitchStack.push(self.lastSwitch);
            self.lastSwitch = null;            
        },
        endIfContext: function() {
            self.lastIf = self.lastIfStack.pop();
            self.lastSwitch = self.lastSwitchStack.pop();            
        }       
    };
    return self;
};

module.exports = DrymlBuffer;