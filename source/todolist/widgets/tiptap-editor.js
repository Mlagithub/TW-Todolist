/*\
title: $:/plugins/kookma/todolist/widgets/tiptap-editor.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TipTapEditorWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

TipTapEditorWidget.prototype = new Widget();

TipTapEditorWidget.prototype.loadTipTapBundle = function(callback) {
    var self = this;
    
    if(window.createTipTapEditor) {
        callback();
        return;
    }
    
    if(window._tiptapLoading) {
        setTimeout(function() {
            self.loadTipTapBundle(callback);
        }, 50);
        return;
    }
    
    window._tiptapLoading = true;
    
    var bundleText = this.wiki.getTiddlerText("$:/plugins/kookma/todolist/tiptap-bundle.js");
    if(bundleText) {
        try {
            var script = this.document.createElement("script");
            script.textContent = bundleText;
            this.document.head.appendChild(script);
            this.document.head.removeChild(script);
            
            window._tiptapLoading = false;
            if(window.createTipTapEditor) {
                console.log("TipTap bundle loaded successfully");
                callback();
            } else {
                console.error("TipTap bundle loaded but createTipTapEditor not found");
            }
        } catch(e) {
            window._tiptapLoading = false;
            console.error("Failed to load TipTap bundle:", e);
        }
    } else {
        console.error("TipTap bundle tiddler not found");
    }
};

TipTapEditorWidget.prototype.render = function(parent,nextSibling) {
    var self = this;
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    var domNode = this.document.createElement("div");
    domNode.className = "tc-tiptap-editor " + (this.editClass || "");
    
    // 只有非输入模式才设置 minHeight
    if(this.editClass !== "kk-todolist-tiptap-input" && this.editMinHeight) {
        domNode.style.minHeight = this.editMinHeight;
    }

    parent.insertBefore(domNode, nextSibling);
    this.domNodes.push(domNode);

    this.loadTipTapBundle(function() {
        self.initEditor(domNode);
    });
};

TipTapEditorWidget.prototype.initEditor = function(domNode) {
    var self = this;

    if(typeof window.createTipTapEditor !== "function") {
        console.error("TipTap: createTipTapEditor not available");
        domNode.innerHTML = "<p style='color:red;'>编辑器加载失败</p>";
        return;
    }

    var editInfo = this.getEditInfo();

    try {
        this.editor = window.createTipTapEditor({
            element: domNode,
            placeholder: this.editPlaceholder || "写下此刻想法...",
            content: editInfo.value || ""
        });

        var saveTimeout;
        this.editor.on('update', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function() {
                var html = self.editor.getHTML();
                if(html === '<p></p>' || html === '') {
                    return;
                }
                editInfo.update(html);
            }, 500);
        });
    } catch(e) {
        console.error("TipTap editor init error:", e);
    }
};

TipTapEditorWidget.prototype.getEditInfo = function() {
    var self = this;
    var value, update;

    if(this.editIndex) {
        value = this.wiki.extractTiddlerDataItem(this.editTitle, this.editIndex, "");
        update = function(val) {
            self.wiki.setText(self.editTitle, undefined, self.editIndex, val);
        };
    } else {
        var tiddler = this.wiki.getTiddler(this.editTitle);
        value = tiddler ? tiddler.getFieldString(this.editField) : "";
        update = function(val) {
            var tiddler = self.wiki.getTiddler(self.editTitle);
            var updateFields = {};
            updateFields[self.editField] = val;
            self.wiki.addTiddler(new $tw.Tiddler(
                tiddler,
                updateFields,
                self.wiki.getModificationFields()
            ));
        };
    }
    return { value: value || "", update: update };
};

TipTapEditorWidget.prototype.execute = function() {
    this.editTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    this.editField = this.getAttribute("field", "text");
    this.editIndex = this.getAttribute("index");
    this.editPlaceholder = this.getAttribute("placeholder", "");
    this.editClass = this.getAttribute("class", "");
    this.editMinHeight = this.getAttribute("minHeight", "60px");
};

TipTapEditorWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(Object.keys(changedAttributes).length > 0) {
        this.refreshSelf();
        return true;
    }

    if(changedTiddlers[this.editTitle]) {
        var editInfo = this.getEditInfo();
        if(this.editor && this.editor.getHTML() !== editInfo.value) {
            this.editor.commands.setContent(editInfo.value);
        }
        return true;
    }
    return false;
};

TipTapEditorWidget.prototype.removeChildDomNodes = function() {
    if(this.editor) {
        this.editor.destroy();
        this.editor = null;
    }
    Widget.prototype.removeChildDomNodes.call(this);
};

exports["tiptap-editor"] = TipTapEditorWidget;