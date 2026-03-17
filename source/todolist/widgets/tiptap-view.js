/*\
title: $:/plugins/kookma/todolist/widgets/tiptap-view.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TipTapViewWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

TipTapViewWidget.prototype = new Widget();

TipTapViewWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    var content = this.content || "";

    if(content && !/<[a-z][\s\S]*>/i.test(content)) {
        content = '<p>' + content + '</p>';
    }

    if(window.DOMPurify) {
        content = window.DOMPurify.sanitize(content);
    }

    var domNode = this.document.createElement("div");
    domNode.className = "tc-tiptap-view " + (this.viewClass || "");
    domNode.innerHTML = content;

    parent.insertBefore(domNode, nextSibling);
    this.domNodes.push(domNode);
};

TipTapViewWidget.prototype.execute = function() {
    var title = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    var field = this.getAttribute("field", "text");
    var index = this.getAttribute("index");
    this.viewClass = this.getAttribute("class", "");

    if(index) {
        this.content = this.wiki.extractTiddlerDataItem(title, index, "");
    } else {
        var tiddler = this.wiki.getTiddler(title);
        this.content = tiddler ? tiddler.getFieldString(field) : "";
    }
};

TipTapViewWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(Object.keys(changedAttributes).length > 0) {
        this.refreshSelf();
        return true;
    }

    var title = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    if(changedTiddlers[title]) {
        this.refreshSelf();
        return true;
    }
    return false;
};

exports["tiptap-view"] = TipTapViewWidget;