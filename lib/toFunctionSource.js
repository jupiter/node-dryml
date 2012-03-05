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
        tmp = ["try { with(_renderFunctions) { with (_clone(locals, { attributes: locals, _attributes:{} })) { "];
        end = ['}} buffer.end(); } catch (err) { buffer.error(err); }'];
        break;
    case 'definition':
        tmp = ["try { with(_renderFunctions) { with (_clone(attributes, { _attributes:{} })) { "];
        end = ['}}} catch (err) { buffer.error(err); }'];
        break;
    default: // tagbody, attribute
        tmp = ["with ({ _attributes:{} }) {"];
        break;
    }
    
    tmp.push('var filepath = "' + options.filepath + '";');
    
    for (var i in structure) {
        var tag = structure[i];

        switch (tag.type) {
        case 'text':
            tmp.push('buffer.print(unescape("' + escape(tag.content) + '"), ' + ((options.encodeEntities === true && !tag.encoded) ? '_encode' : 'null') + ');');
            break;
        case 'comment':
            tmp.push('buffer.print(unescape("' + escape('<!-- ' + tag.content.trim() + ' -->') + '"));');
            break;
        default:
            var tagName = (tag.prefix) ? tag.prefix + ':' + tag.element : tag.element;
            tmp.push('buffer.trace(filepath, "' + tagName + '", ' + tag.line + ', ' + tag.column + ');');
            switch (tag.element) {
            case '%':
                var ejsType = tag.attrs.ejs[0],
                    ejs = tag.attrs.ejs.slice(1, tag.attrs.ejs.length - 1).trim();

                switch (ejsType) {
                  case '=':
                      tmp.push('buffer.print(' + ejs + ((options.encodeEntities === true) ? ', _encode' : '') + ');');
                      break;                  
                  case '-':
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
                tmp.push('if (tagbody) { tagbody.call(this, buffer); };');
                break;
            case 'with':
                var attrs = (tag.attrs && tag.attrs.attrs) ? tag.attrs.attrs : '',
                    attr = (tag.attrs && tag.attrs.async) ? tag.attrs.async : (tag.attrs && tag.attrs.obj) ? tag.attrs.obj : '',
                    ejs = (attr[attr.length - 1] == '}' && attr.indexOf('%{') === 0) ? attr.slice(2, attr.length - 1) : null,
                    async = (tag.attrs && tag.attrs.async);
                        
                tmp.push('(function(){');    
                var tagbodyVar = 'var withBody = function(){ with(_argumentsAsObject(arguments, unescape("' + escape(attrs) + '"))) {' + toFunctionSource(tag.children, 'with', options) + '} };';
                if (ejs) {
                    if (async) {
                        tmp.push('var _self = this;');
                        tmp.push('buffer.print(buffer.async(this, function(buffer){ ' + tagbodyVar + 'withBody = _functionInScope(_self, withBody);' + ejs + '}));')                    
                    } else {
                        tmp.push(tagbodyVar);
                        tmp.push('withBody.call(' + ejs + ');');
                    }                    
                } else {        
                    tmp.push(tagbodyVar);
                    if (attr) {
                        tmp.push('withBody.call(unescape("' + escape(attr) + '"));');                                                  
                    } else {
                        tmp.push('withBody.call(this);');                                                  
                    }   
                }
                tmp.push('}).call(this);');
                break;
            default:
                // Extract attributes from direct children											
                if (tag.children) {
                    for (var j in tag.children) {
                        var child = tag.children[j];
                        if (child.type == 'tag' && child.prefix == 'attr') {
                            var name = child.element;
                            if (!tag.attrs) tag.attrs = {};
                            tag.attrs[name] = '%{ ' + 
                            'buffer.async(this, function(buffer){ ' + toFunctionSource(child.children, 'attribute', options) + 'buffer.end(); },' +
                            ' [filepath, "' + child.prefix + ':' + child.element + '", ' + child.line + ', ' + child.column + '])' + 
                            ' }';
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
                    } else if (attr[attr.length - 1] == '}' && attr.indexOf('#{') === 0) {
                        tmp.push('"' + key + '": buffer.error(new Error("#{} encountered")), ');
                    } else {
                        tmp.push('"' + key + '": unescape("' + escape(attr) + '"), ');
                    }
                }
                tmp.push('};');

                // Merge class attribute
                tmp.push('if (typeof(_attributes["merge-class"]) != "undefined") _mergeClassAttribute(_attributes, attributes);')
                
                // Merge globals
                tmp.push('if (typeof(_attributes["merge-globals"]) != "undefined") _mergeAttributes(_attributes, buffer.globals);')                
                
                // Merge attributes
                tmp.push('if (typeof(_attributes["merge-attrs"]) != "undefined") _mergeAttributes(_attributes, attributes, _keys);')
                
                if (tag.children && tag.children.length > 0) {
                    tmp.push('_applyTag(this, taglib, "' + tagName + '", _attributes, buffer, function(buffer){');
                    tmp.push(toFunctionSource(tag.children, 'tagbody', options));
                    tmp.push('});');
                } else {
                    tmp.push('_applyTag(this, taglib, "' + tagName + '", _attributes, buffer, null);');
                }
                break;
            }
            tmp.push('buffer.exit();');
            break;
        }
    }
    tmp.push(end);
    return tmp.join('');
};