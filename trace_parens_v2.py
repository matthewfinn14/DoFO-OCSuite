
def trace_parens_v2(filename):
    with open(filename, 'r') as f:
        # Read starting from where script usually starts if possible, 
        # but simpler to just process whole file if we can distinguish basic js
        # The file is HTML + JS. HTML attributes might look like strings.
        # But the error is in the babel script.
        # Let's find the script tag logic from debug_syntax_v2
        html = f.read()

    script_start_marker = '<script type="text/babel">'
    script_end_marker = '</script>'
    
    try:
        start_idx = html.index(script_start_marker) + len(script_start_marker)
        end_idx = html.index(script_end_marker, start_idx)
    except ValueError:
        print("Could not find script block")
        return

    script_content = html[start_idx:end_idx]
    
    # Calculate line number offset
    pre_script = html[:start_idx]
    start_line_num = pre_script.count('\n') + 1

    chars = list(script_content)
    length = len(chars)
    i = 0
    in_string = False
    string_char = ''
    in_comment_line = False
    in_comment_block = False

    while i < length:
        char = chars[i]
        
        if in_string:
            if char == string_char:
                if i > 0 and chars[i-1] == '\\' and not (i > 1 and chars[i-2] == '\\'):
                    pass
                else:
                    in_string = False
            if char == '\n':
                pass # keep newline
            else:
                chars[i] = ' ' 
            i += 1
            continue

        if in_comment_line:
            if char == '\n':
                in_comment_line = False
                # Keep newline
            else:
                chars[i] = ' '
            i += 1
            continue

        if in_comment_block:
            if char == '*' and i + 1 < length and chars[i+1] == '/':
                chars[i] = ' '
                chars[i+1] = ' '
                in_comment_block = False
                i += 2
                continue
            if char != '\n': # preserve newlines
                chars[i] = ' '
            i += 1
            continue

        if char in '"\'`':
            in_string = True
            string_char = char
            chars[i] = ' '
            i += 1
            continue
            
        if char == '/' and i + 1 < length:
            if chars[i+1] == '/':
                in_comment_line = True
                chars[i] = ' '
                chars[i+1] = ' '
                i += 2
                continue
            if chars[i+1] == '*':
                in_comment_block = True
                chars[i] = ' '
                chars[i+1] = ' '
                i += 2
                continue

        i += 1

    masked_text = "".join(chars)
    
    stack = []
    # line_num is relative to script start, so add start_line_num
    
    current_line = 0
    for idx, char in enumerate(masked_text):
        if char == '\n':
            current_line += 1
            continue
            
        if char == '(':
            stack.append((start_line_num + current_line, idx))
        elif char == ')':
            if stack:
                stack.pop()
            else:
                print(f"Extra closing paren at Line {start_line_num + current_line}")

    print(f"Total Unclosed: {len(stack)}")
    for item in stack[:10]:
        print(f"Unclosed open paren at Line {item[0]}")

if __name__ == "__main__":
    trace_parens_v2('index.html')
