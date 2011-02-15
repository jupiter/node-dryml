/**
 * HTML tags belonging to strict XHTML, not reserved tag names and characters 
 * (see <http://htmldog.com/reference/htmltags/>)
 */
var html = exports.html = "a,abbr,acronym,address,area,b,base,bdo,big,blockquote,body,br,button,caption,cite,code,col,colgroup,dd,del,dfn,div,dl,DOCTYPE,dt,em,fieldset,form,h1,h2,h3,h4,h5,h6,head,html,hr,i,img,input,ins,kbd,label,legend,li,link,map,meta,noscript,object,ol,optgroup,option,p,param,pre,q,samp,script,select,small,span,strong,style,sub,sup,table,tbody,td,textarea,tfoot,th,thead,title,tr,tt,ul,var".split(','),
	restricted = exports.restricted = "def,tagbody,attr,taglib,document".split(','),
	validCharacters = exports.validCharacters = new RegExp("^[A-Za-z]([A-Za-z0-9._]|'-')*");
	
exports.isValidTagname = function(name) {
	if (html.indexOf(name) == -1 && restricted.indexOf(name) == -1 && validCharacters.test(name)) {
		return true;
	} else {
		return false;
	}
}