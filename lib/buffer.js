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
        trace: function(filename, tag, line, column) {
            self.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
        },
        print: function(str) {
            if (str !== null) {
                self.str = self.str.concat(str);
            }
        },
        async: function(scope, callback) {
            var buffer = self;
            buffer.indexes++;
            buffer.count++;
            var index = buffer.indexes,
                replacementStr = '§B' + index + '§';

            var asyncBuffer = buffer[index] = {
                stackTrace: [],
                str: "",
                trace: function(filename, tag, line, column) {
                    asyncBuffer.stackTrace.push('    at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
                },
                print: function(str) {
                    asyncBuffer.str = asyncBuffer.str.concat(str);
                },
                end: function() {
                    self.replacements[replacementStr] = asyncBuffer.str;
                    buffer.count--;
                    if (buffer.shouldEnd) {
                        buffer.end();
                    }
                },
                async: function(scope, callback) {
                    return buffer.async(scope, callback);
                }
            };
            callback.call(scope, asyncBuffer);
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
                self.callback(null, self);
            } else {
                self.shouldEnd = true;
            }
            return self.str;
        },
        error: function(err) {
            err = new Error(err.message + '\n' + self.stackTrace.slice( - 5).reverse().join('\n'));
            self.callback(err, self);
        }
    };
    return self;
};

module.exports = Buffer;