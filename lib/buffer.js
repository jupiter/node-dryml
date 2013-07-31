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
var DrymlBuffer = function DrymlBuffer(callback) {
  this.callback = (callback) ? callback: function() {};
  this.indexes = 0;
  this.count = 0;
  this.depth = 1;
  this.buffers = [];
  this.str = "";
  this.stackTrace = [];
  this.replacements = {};
  this.shouldEnd = false;
  this.ended = false;        
  this.fieldId = 9;
  this.lastIf = null;
  this.lastIfStack = null; // [] on first access
  this.lastSwitch = null;
  this.lastSwitchStack = null; // [] on first access     
};

DrymlBuffer.prototype.async = function(scope, callback, trace) {
  var buffer = this; 
  buffer.indexes++;
  buffer.count++;
  var index = buffer.indexes;      
  
  if (trace) buffer.trace.apply(this, trace);

  var asyncBuffer = buffer[index] = new AsyncDrymlBuffer(buffer);
  var replacementStr = asyncBuffer.replacementStr = '§B' + index + '§';
  
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
};

DrymlBuffer.prototype.trace = function(filename, tag, line, column) {
  var self = this;
  
  self.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
};

DrymlBuffer.prototype.exit = function() {
  var self = this;
  
  self.stackTrace.pop();
};  
      
DrymlBuffer.prototype.print = function(str, middleware) {
  var self = this;
  
  if (str !== null && str !== undefined) {
      self.str += ((middleware) ? middleware(str) : str);
  }
};

DrymlBuffer.prototype.end = function() {
  var self = this;
  
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
};

DrymlBuffer.prototype.error = function(err, errBuffer) {
  var self = this;
  
  if (!errBuffer) errBuffer = self;
  // err = new Error(err.message); Return original error
  err.stack = err.stack.replace('\n    at',  '\n    ' + errBuffer.stackTrace.slice( - 5).reverse().join('\n    ') + '\n    at');
  if (!self.ended) {
      self.ended = true;
      self.callback(err, self);                
  }
};

DrymlBuffer.prototype.newFieldId = function(prefix) {
  var self = this;
  
  prefix = prefix || 'field';
  self.fieldId += 1;
  return prefix + '-' + self.fieldId.toString(16);;
};

DrymlBuffer.prototype.startIfContext = function() {
  (this.lastIfStack || (this.lastIfStack = [])).push(this.lastIf);
  this.lastIf = null;
  (this.lastSwitchStack || (this.lastSwitchStack = [])).push(this.lastSwitch);
  this.lastSwitch = null;        
};

DrymlBuffer.prototype.endIfContext = function() {
  this.lastIf = this.lastIfStack.pop();
  this.lastSwitch = this.lastSwitchStack.pop();            
}

module.exports = DrymlBuffer;

var AsyncDrymlBuffer = function AsyncDrymlBuffer(parentBuffer) {
  this.parentBuffer = parentBuffer;
  this.stackTrace = _.clone(parentBuffer.stackTrace);
  this.ended = false;
  this.str = "";
  this.lastIf = null;
  this.lastIfStack = null; // [] on first access
  this.lastSwitch = null;
  this.lastSwitchStack = null; // [] on first access        
  this.globals = parentBuffer.globals;
}

AsyncDrymlBuffer.prototype.newFieldId = DrymlBuffer.prototype.newFieldId;

AsyncDrymlBuffer.prototype.trace = function(filename, tag, line, column) {
  this.stackTrace.push('at ' + tag + ' (' + filename + ':' + line + ':' + column + ')');
};

AsyncDrymlBuffer.prototype.exit = function() {
  this.stackTrace.pop();
};    
             
AsyncDrymlBuffer.prototype.print = function(str, middleware) {
  if (str !== null && str !== undefined) {                    
    this.str += ((middleware) ? middleware(str) : str);
  }
}; 

AsyncDrymlBuffer.prototype.end = function() {
  this.parentBuffer.replacements[this.replacementStr] = this.str;
  this.ended = true;
  this.parentBuffer.count--;
  if (this.parentBuffer.shouldEnd) {
      this.parentBuffer.end();
  }
}; 

AsyncDrymlBuffer.prototype.async = function(scope, callback) {
  this.parentBuffer.depth = this.parentBuffer.depth + 1;
  return this.parentBuffer.async(scope, callback);
}; 

AsyncDrymlBuffer.prototype.error = function(err, errBuffer) {
  this.parentBuffer.error(err, errBuffer);
}; 

AsyncDrymlBuffer.prototype.startIfContext = function() {
  (this.lastIfStack || (this.lastIfStack = [])).push(this.lastIf);
  this.lastIf = null;
  (this.lastSwitchStack || (this.lastSwitchStack = [])).push(this.lastSwitch);
  this.lastSwitch = null;
}; 

AsyncDrymlBuffer.prototype.endIfContext = function() {
  this.lastIf = this.lastIfStack.pop();
  this.lastSwitch = this.lastSwitchStack.pop();
};              