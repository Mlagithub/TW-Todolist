#!/bin/bash
# Build TiddlyWiki plugin from source files

cd "$(dirname "$0")"
SOURCE_DIR="source/todolist"
OUTPUT_FILE="packaged/todolist.tid"

python3 << 'PYTHON'
import json
import os
import re

source_dir = "source/todolist"

# Read plugin.info
with open(os.path.join(source_dir, "plugin.info"), "r") as f:
    plugin_info = json.load(f)

# Collect all tiddlers
tiddlers = {}

def read_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def process_file(filepath, relative_path):
    """Process a source file and return tiddler data"""
    title = "$:/plugins/kookma/todolist/" + relative_path.replace("\\", "/")
    
    # Check for .meta file
    meta_path = filepath + ".meta"
    tiddler = {"title": title}
    
    if os.path.exists(meta_path):
        # Use meta file for metadata
        try:
            with open(meta_path, "r") as f:
                meta = json.load(f)
            tiddler.update(meta)
        except:
            pass
        text = read_file(filepath)
        if text:
            tiddler["text"] = text
    elif filepath.endswith(".tid"):
        # Parse .tid file (fields then text)
        content = read_file(filepath)
        lines = content.split("\n")
        i = 0
        while i < len(lines) and lines[i].strip():
            if ":" in lines[i]:
                key, value = lines[i].split(":", 1)
                tiddler[key.strip()] = value.strip()
            i += 1
        tiddler["text"] = "\n".join(lines[i+1:]) if i + 1 < len(lines) else ""
    elif filepath.endswith(".js"):
        # Parse JS file header comment
        content = read_file(filepath)
        tiddler["type"] = "application/javascript"
        tiddler["text"] = content
        
        # Extract metadata from header comment
        for match in re.finditer(r'(\w+):\s*(.+)', content.split('*/')[0] if '*/' in content else content[:500]):
            key = match.group(1).lower()
            value = match.group(2).strip()
            if key in ['title', 'type', 'module-type', 'caption', 'description']:
                tiddler[key] = value
    elif filepath.endswith(".css"):
        tiddler["type"] = "text/css"
        tiddler["tags"] = "$:/tags/Stylesheet"
        tiddler["text"] = read_file(filepath)
    else:
        # Generic file
        tiddler["text"] = read_file(filepath)
    
    return tiddler

# Walk source directory
for root, dirs, files in os.walk(source_dir):
    for filename in files:
        if filename == "plugin.info" or filename.endswith(".meta"):
            continue
        
        filepath = os.path.join(root, filename)
        relative = os.path.relpath(filepath, source_dir)
        
        try:
            tiddler = process_file(filepath, relative)
            tiddlers[tiddler["title"]] = tiddler
            print(f"Added: {tiddler['title']}")
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

# Build plugin tiddler
output_lines = []
output_lines.append(f"author: {plugin_info.get('author', '')}")
output_lines.append(f"core-version: {plugin_info.get('core-version', '')}")
output_lines.append(f"description: {plugin_info.get('description', '')}")
output_lines.append(f"list: {plugin_info.get('list', '')}")
output_lines.append(f"name: {plugin_info.get('name', '')}")
output_lines.append(f"plugin-type: plugin")
output_lines.append(f"source: {plugin_info.get('source', '')}")
output_lines.append(f"tags: ")
output_lines.append(f"title: {plugin_info['title']}")
output_lines.append(f"type: application/json")
output_lines.append(f"version: {plugin_info.get('version', '')}")
output_lines.append("")
output_lines.append(json.dumps({"tiddlers": tiddlers}, ensure_ascii=False, separators=(',', ':')))

with open("packaged/todolist.tid", "w") as f:
    f.write("\n".join(output_lines))

print(f"\nBuilt: packaged/todolist.tid")
print(f"Total tiddlers: {len(tiddlers)}")
PYTHON
