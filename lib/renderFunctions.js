/**
 * Tags to self-close (see http://www.w3schools.com/tags/default.asp)
 */
var selfClosingTags = ["area", "base", "basefont", "br", "col", "frame", "hr", "img", "input", "link", "meta", "param"];

/**
 * Module dependencies.
 */
var isValidAttributename = require('./isValidName').isValidAttributename;
var entities = require('entities');
    
/**
 * Functions used during rendering
 */
var self = module.exports = {
    _alwaysCloseTags: true,
    _outputBlankAttrs: false,
    _encode: function(obj, removeNewline){
      // Don't output null or undefined
      if (obj == null) return '';
      
      // Ensure entities are encoded
      var str = entities.encode(obj.toString());
      
      // Only remove newlines when removeNewLine is specified (e.g. in attrs)
      return (removeNewline) ? str : str.replace(/\&#10;/g, '\n');
    },
    '_': require('underscore'),      
    _mergeAttributes: function(tagAttributes, contextAttributes, definedKeys) {
        var attrKey = (definedKeys) ? 'merge-attrs' : 'merge-globals';
        if (typeof(tagAttributes[attrKey].split) == 'function' && typeof(contextAttributes) == 'object') {
            var mergeKeys = tagAttributes[attrKey].split(','),
                allKeys = Object.keys(contextAttributes);
            delete(tagAttributes[attrKey]);
            
            var includeUnspecified = mergeKeys.indexOf('*');
            if (includeUnspecified > -1) {
                delete(mergeKeys[includeUnspecified]);
                includeUnspecified = true;
            } else {
                includeUnspecified = false;
            }
            var includeAll = (mergeKeys.indexOf('') > -1);
            
            for (var attr in contextAttributes) {
                if (mergeKeys.indexOf(attr) > -1 || (attr != 'class' && (includeAll || (includeUnspecified && definedKeys && definedKeys.indexOf(attr) == -1))) && !tagAttributes[attr] && contextAttributes[attr]) 
                    tagAttributes[attr] = contextAttributes[attr];
            }
        }
    },
    _mergeClassAttribute: function(tagAttributes, contextAttributes ) {
        var classAttribute = tagAttributes['merge-class'],
            contextClassAttribute = contextAttributes['class'];
        delete(tagAttributes['merge-class']);
        if (self._.isString(classAttribute)) {
            if (self._.isString(contextClassAttribute) ) {
                tagAttributes['class'] = self._.uniq(self._.select(contextClassAttribute.split(' ').concat(classAttribute.split(' ')), function(v){return v;})).join(' ');
            } else {
                tagAttributes['class'] = classAttribute;
            }
        }
    },
    _applyTag: function(context, taglib, name, attributes, buffer, callback) {
        var tag = (taglib._core && taglib._core[name]) || taglib[name] || (taglib._notExported && taglib._notExported[name]);
        if (tag) {
            if (typeof attributes.obj != 'undefined') {
                context = attributes.obj;
                delete(attributes.obj);
            }
            var definedAttributes = {
                attributes: attributes,
                _keys: tag.attributes
            };

            for (var i in tag.attributes) {
                var key = tag.attributes[i];
                definedAttributes[key] = (typeof(attributes[key]) != 'undefined') ? attributes[key] : null;
            }

            tag.fn.call(context, this, definedAttributes, taglib, buffer, callback);
        } else {
            var attributesStr = '';

            for (var attr in attributes) {
                var value = attributes[attr];
                
                if (value == null || (value === '' && !self._outputBlankAttrs)) {
                  // Omit blank attributes
                } else {
                  attributesStr = attributesStr.concat(attr + '="' + self._encode(value, true) + '" ');                  
                };                
            }
            if (attributesStr.length > 0) attributesStr = ' ' + attributesStr.trim();
            if (callback) {
                buffer.print('<' + name + attributesStr + '>');
                callback.call(context, buffer);
                buffer.print('</' + name + '>');
            } else {
                if (selfClosingTags.indexOf(name) > -1) {
                    buffer.print('<' + name + attributesStr + ((self._alwaysCloseTags) ? '/' : '') + '>');
                } else {
                    buffer.print('<' + name + attributesStr + '></' + name + '>');
                }
                
            }
        }
    },
    _argumentsAsObject: function(args, names) {
        var obj = {},
            attrs = (names) ? names.replace(/\s/, '').split(',') : [];        
        for (var i in attrs) {
            if (isValidAttributename(attrs[i])) {
                obj[attrs[i]] = args[i] || null;
            }
        }
        return obj;
    },
    _clone: function(obj, mergeObj) {
        var out = self._.clone(obj);
        
        if (typeof(mergeObj) === 'object') {
            for (i in mergeObj) {
                out[i] = arguments.callee(mergeObj[i]);
            }            
        }
        return out;
    },
    _deepCopy: function(obj, mergeObj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
            var out = [],
                i = 0,
                len = obj.length;
            for (; i < len; i++) {
                out[i] = arguments.callee(obj[i]);
            }
            return out;
        }
        if (typeof obj === 'object' && obj != null) {
            var out = {},
                i;

            if (typeof mergeObj === 'object') {
                for (i in obj) {
                    out[i] = arguments.callee(obj[i]);
                }
                for (i in mergeObj) {
                    out[i] = arguments.callee(mergeObj[i]);
                }
            } else {
                for (i in obj) {
                    out[i] = obj[i];
                }                
            }
            return out;
        }
        return obj;
    },
    _functionInScope: function(scope, fn) {
        return function() {
            fn.apply(scope, arguments);
        };
    }
};