/**
 * Parse the given dryml structure, returning the function source.
 *
 * @param {Object} structure
 * @param {String} type [page, definition, attribute, tagbody]
 * @param {Object} options
 * @return {String}
 * @api public
 */
var toFunctionSource = module.exports = function(structure, type, options) {
    var tmp;
    var end = ['}'];

    switch (type) {
    case 'page':
        tmp = ["try { with(_renderFunctions) { with (_deepCopy(locals, { _attributes:{} })) {"];
        end = ['}} buffer.end(); } catch (err) { buffer.error(err); }'];
        tmp = ["with(_renderFunctions) { with (_deepCopy(locals, { _attributes:{} })) {"];
        end = ['}} buffer.end();'];
        break;
    case 'definition':
        tmp = ["with(_renderFunctions) { with (_deepCopy(attributes, { _attributes:{} })) {"];
        end = ['}}'];
        break;
    default:
        tmp = ["with ({ _attributes:{} }) {"];
        break;
    }

    for (var i in structure) {
        var tag = structure[i];

        switch (tag.type) {
        case 'text':
            tmp.push('buffer.print(unescape("' + escape(tag.content) + '"));');
            break;
        case 'comment':
            tmp.push('buffer.print(unescape("' + escape('<!-- ' + tag.content.trim() + ' -->') + '"));');
            break;
        default:
            tmp.push('buffer.trace("' + options.filename + '", "' + tag.element + '", ' + tag.line + ', ' + tag.column + ');');
            switch (tag.element) {
            case '%':
                var ejsType = tag.attrs.ejs[0],
                    ejs = tag.attrs.ejs.slice(1, tag.attrs.ejs.length - 1).trim();

                switch (ejsType) {
                case '=':
                    tmp.push('buffer.print(' + ejs + ');');
                    break;
                case '?':
                    tmp.push('buffer.print(buffer.async(this, function(buffer){ ' + ejs + ' }));');
                    break;
                default:
                    tmp.push('\n' + ejsType + ejs + '\n');
                    break;
                }
                break;
            case 'def':
                // Ignore
                // TODO: Error
                break;
            case 'taglib':
                // Ignore
                // TODO: Error
                break;
            case 'tagbody':
                tmp.push('if (tagbody) { tagbody.call(this); };');
                break;
            default:
                // Extract attributes from direct children											
                if (tag.children) {
                    for (var j in tag.children) {
                        var child = tag.children[j];
                        if (child.type == 'tag' && child.prefix == 'attr') {
                            var name = child.element;
                            if (!tag.attrs) tag.attrs = {};
                            tag.attrs[name] = '%{ ' + 'buffer.async(this, function(buffer){ ' + toFunctionSource(child.children, 'attribute', options) + 'buffer.end(); })' + ' }';
                            delete(tag.children[j]);
                        }
                    }
                }

                // Parse attributes with ejs and merge
                tmp.push('_attributes = {');
                for (var key in tag.attrs) {
                    var attr = tag.attrs[key];
                    if (attr[attr.length - 1] == '}' && attr.indexOf('%{') === 0) {
                        tmp.push('"' + key + '": (' + attr.slice(2, attr.length - 1) + '), ');
                    } else {
                        tmp.push('"' + key + '": unescape("' + escape(attr) + '"), ');
                    }
                }
                tmp.push('};');
                // Merge attributes
                tmp.push('if (typeof(_attributes["merge-attrs"]) != "undefined") _mergeAttributes(_attributes, attributes, _keys);')
                
                // if (options.debug) tmp.push('buffer.print(JSON.stringify(_attributes));');
                if (tag.children && tag.children.length > 0) {
                    tmp.push('_applyTag(this, taglib, "' + tag.element + '", _attributes, buffer, function(){');
                    tmp.push(toFunctionSource(tag.children, 'tagbody', options));
                    tmp.push('});');
                } else {
                    tmp.push('_applyTag(this, taglib, "' + tag.element + '", _attributes, buffer, null);');
                }
                break;
            }
            break;
        }
    }
    tmp.push(end);
    return tmp.join('');
};