import sys
import re

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
except FileNotFoundError:
    print("index.html not found")
    sys.exit(1)

script_start_marker = '<script type="text/babel">'
script_end_marker = '</script>'

start_idx = html.find(script_start_marker)
if start_idx == -1:
    print("Script tag not found")
    sys.exit(1)

content_start = start_idx + len(script_start_marker)
end_idx = html.find(script_end_marker, content_start)

if end_idx == -1:
    print("Script end tag not found")
    sys.exit(1)

script_content = html[content_start:end_idx]

# Remove comments and strings to count braces safely
# Regex to match strings and comments
pattern = r"(\".*?\"|\'.*?\'|`[^`]*`|//.*$|/\*[\s\S]*?\*/)"
# We need to be careful with regex in Python not handling nested structures, but good enough for simple cleaning

def clean_code(text):
    # This is a naive cleaner, might break on complex regex literals / inside strings
    # But better than nothing.
    # Replace contents of strings/comments with spaces to preserve line numbers if needed, 
    # but here we just want balance.
    
    # Simple state machine is better
    clean = []
    i = 0
    length = len(text)
    in_string = False
    string_char = ''
    in_comment_line = False
    in_comment_block = False
    
    while i < length:
        char = text[i]
        
        if in_string:
            if char == string_char:
                # Check for escape
                if i > 0 and text[i-1] == '\\' and not (i > 1 and text[i-2] == '\\'):
                    pass # Escaped quote
                else:
                    in_string = False
            i += 1
            continue
            
        if in_comment_line:
            if char == '\n':
                in_comment_line = False
            i += 1
            continue
            
        if in_comment_block:
            if char == '*' and i + 1 < length and text[i+1] == '/':
                in_comment_block = False
                i += 2
                continue
            i += 1
            continue
            
        # Check start of string
        if char in '"\'`':
            in_string = True
            string_char = char
            i += 1
            continue
            
        # Check start of comment
        if char == '/' and i + 1 < length:
            if text[i+1] == '/':
                in_comment_line = True
                i += 2
                continue
            if text[i+1] == '*':
                in_comment_block = True
                i += 2
                continue
        
        clean.append(char)
        i += 1
        
    return "".join(clean)

cleaned_code = clean_code(script_content)

brace_count = 0
paren_count = 0

for char in cleaned_code:
    if char == '{':
        brace_count += 1
    elif char == '}':
        brace_count -= 1
    elif char == '(':
        paren_count += 1
    elif char == ')':
        paren_count -= 1

print(f"Final Brace Count (Cleaned): {brace_count}")
print(f"Final Paren Count (Cleaned): {paren_count}")
