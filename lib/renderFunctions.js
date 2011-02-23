/**
 * Functions used during rendering
 */
module.exports = {
    _applyTag: function(context, taglib, name, attributes, buffer, callback) {
        var tag = taglib[name];
        if (tag) {
            if (attributes.obj) {
                context = attributes.obj;
                delete(attributes.obj);
            }
            var definedAttributes = {
                attributes: attributes
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
                    attributesStr = attributesStr.concat(attr + '="' + attributes[attr] + '" ');
                }
            }
            if (attributesStr.length > 0) attributesStr = ' ' + attributesStr.trim();
            if (callback) {
                buffer.print('<' + name + attributesStr + '>');
                callback.call(context);
                buffer.print('</' + name + '>');
            } else {
                buffer.print('<' + name + attributesStr + '/>');
            }
        }
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
            for (i in obj) {
                out[i] = arguments.callee(obj[i]);
            }
            if (typeof mergeObj === 'object') {
                for (i in mergeObj) {
                    out[i] = arguments.callee(mergeObj[i]);
                }
            }
            return out;
        }
        return obj;
    }
};