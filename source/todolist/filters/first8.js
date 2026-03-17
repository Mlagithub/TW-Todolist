/*\
title: $:/plugins/kookma/todolist/filters/first8.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.first8 = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(title && title.length >= 8) {
			var first8 = title.substring(0,8);
			if(results.indexOf(first8) === -1) {
				results.push(first8);
			}
		}
	});
	return results;
};