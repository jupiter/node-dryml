/**
 * Tags to self-close (see http://www.w3schools.com/tags/default.asp)
 */
var selfClosingTags = ["area", "base", "basefont", "br", "col", "frame", "hr", "img", "input", "link", "meta", "param"];

/**
 * Functions used during rendering
 */
var self = module.exports = {
    _encode:  require('Js-entities').xml.encode,
    '_': require('underscore'),
    _mergeAttributes: function(tagAttributes, contextAttributes, definedKeys) {
        if (typeof(tagAttributes['merge-attrs'].split) == 'function' && typeof(contextAttributes) == 'object') {
            var mergeKeys = tagAttributes['merge-attrs'].split(','),
                allKeys = Object.keys(contextAttributes);
            delete(tagAttributes['merge-attrs']);
            
            var includeUnspecified = mergeKeys.indexOf('*');
            if (includeUnspecified > -1) {
                delete(mergeKeys[includeUnspecified]);
                includeUnspecified = true;
            } else {
                includeUnspecified = false;
            }
            var includeAll = (mergeKeys.indexOf('') > -1);
            
            for (var attr in contextAttributes) {
                if ((includeAll || mergeKeys.indexOf(attr) > -1 || (includeUnspecified && definedKeys.indexOf(attr) == -1)) && !tagAttributes[attr] && contextAttributes[attr]) 
                    tagAttributes[attr] = contextAttributes[attr];
            }
        }
    },
    _mergeClassAttribute: function(tagAttributes, contextAttributes ) {
        var classAttribute = tagAttributes['merge-class'],
            contextClassAttribute = contextAttributes['class'];
        delete(tagAttributes['merge-class']);
        if (self._.isString(classAttribute)) {
            if (self._.isString(contextClassAttribute)) {
                tagAttributes['class'] = self._.uniq(contextClassAttribute.split(' ').concat(classAttribute.split(' '))).join(' ');
            }
        }
    },
    _applyTag: function(context, taglib, name, attributes, buffer, callback) {
        var tag = taglib[name];
        if (tag) {
            if (attributes.obj) {
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
                if (attributes[attr] != null) {
                    attributesStr = attributesStr.concat(attr + '="' + self._encode(attributes[attr]) + '" ');
                }
            }
            if (attributesStr.length > 0) attributesStr = ' ' + attributesStr.trim();
            if (callback) {
                buffer.print('<' + name + attributesStr + '>');
                callback.call(context);
                buffer.print('</' + name + '>');
            } else {
                if (selfClosingTags.indexOf(name) > -1) {
                    buffer.print('<' + name + attributesStr + '/>');
                } else {
                    buffer.print('<' + name + attributesStr + '></' + name + '>');
                }
                
            }
        }
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
    }
};