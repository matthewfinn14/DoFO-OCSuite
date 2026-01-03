import sys

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
except FileNotFoundError:
    print("index.html not found")
    sys.exit(1)

script_start_marker = '<script type="text/babel">'
script_end_marker = '</script>'

start_idx = html.find(script_start_marker)
content_start = start_idx + len(script_start_marker)
end_idx = html.find(script_end_marker, content_start)
script_content = html[content_start:end_idx]

# Reuse cleaner logic (simplified for brevity here, assuming it works)
def clean_code(text):
    clean = []
    i = 0
    length = len(text)
    in_string = False
    string_char = ''
    in_comment_line = False
    in_comment_block = False
    
    # We want to preserve newlines!
    
    while i < length:
        char = text[i]
        
        if in_string:
            if char == string_char:
                if i > 0 and text[i-1] == '\\' and not (i > 1 and text[i-2] == '\\'):
                    pass 
                else:
                    in_string = False
            # Keep newlines in strings? Usually no newlines in normal strings, but template literals yes.
            # We will just emit space unless it's newline
            if char == '\n': clean.append('\n')
            else: clean.append(' ') 
            i += 1
            continue
            
        if in_comment_line:
            if char == '\n':
                in_comment_line = False
                clean.append('\n')
            else:
                 clean.append(' ')
            i += 1
            continue
            
        if in_comment_block:
            if char == '*' and i + 1 < length and text[i+1] == '/':
                in_comment_block = False
                i += 2
                clean.append('  ')
                continue
            if char == '\n': clean.append('\n')
            else: clean.append(' ')
            i += 1
            continue
            
        # Check start
        if char in '"\'`':
            in_string = True
            string_char = char
            clean.append(' ')
            i += 1
            continue
            
        if char == '/' and i + 1 < length:
            if text[i+1] == '/':
                in_comment_line = True
                i += 2
                clean.append('  ')
                continue
            if text[i+1] == '*':
                in_comment_block = True
                i += 2
                clean.append('  ')
                continue
        
        clean.append(char)
        i += 1
        
    return "".join(clean)

cleaned_code = clean_code(script_content)
lines = cleaned_code.split('\n')

paren_count = 0
open_paren_locations = [] # Stack of (line_num)

for line_num, line in enumerate(lines):
    for char in line:
        if char == '(':
            paren_count += 1
            open_paren_locations.append(line_num + 1)
        elif char == ')':
            paren_count -= 1
            if open_paren_locations:
                open_paren_locations.pop()

if paren_count > 0:
    print(f"Unclosed Parens Count: {paren_count}")
    print("First 5 Unclosed Paren Line Numbers in script:")
    print(open_paren_locations[:5])
    
    # Print the context of the first unclosed paren
    if open_paren_locations:
        first_line = open_paren_locations[0] - 1
        print(f"Line {open_paren_locations[0]}: {lines[first_line].strip()}")
