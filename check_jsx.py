
import re
import sys

def check_jsx_balance(filename, start_line):
    with open(filename, 'r') as f:
        all_lines = f.readlines()

    content = "".join(all_lines[start_line-1:])

    state = "NORMAL"
    stack = []
    
    void_tags = {'link', 'img', 'br', 'hr', 'input', 'meta', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr', 'area'}
    
    tag_start_line = 0
    current_tag = ""
    current_tag_finished = False
    is_closing = False
    is_self_closing = False
    
    brace_depth = 0
    
    line_num = start_line
    i = 0
    while i < len(content):
        char = content[i]
        
        if char == '\n':
            line_num += 1
            
        if state == "NORMAL":
            if char == '<':
                if i + 1 < len(content):
                    next_char = content[i+1]
                    if next_char == '/' or next_char.isalpha() or next_char == '_' or next_char == '>':
                        state = "IN_TAG"
                        if next_char == '/':
                            is_closing = True
                            i += 1
                        else:
                            is_closing = False
                        current_tag = ""
                        current_tag_finished = False
                        tag_start_line = line_num
                        brace_depth = 0
            elif char == '"': state = "IN_STRING_DOUBLE"
            elif char == "'": state = "IN_STRING_SINGLE"
            elif char == '`': state = "IN_STRING_BACKTICK"
            elif char == '/' and i + 1 < len(content):
                if content[i+1] == '/':
                    state = "IN_COMMENT_LINE"
                    i += 1
                elif content[i+1] == '*':
                    state = "IN_COMMENT_BLOCK"
                    i += 1
        
        elif state == "IN_TAG":
            if char == '{':
                brace_depth += 1
            elif char == '}':
                brace_depth -= 1
            elif char == '>' and brace_depth == 0:
                if not current_tag:
                    current_tag = "FRAGMENT"
                
                if is_self_closing or (current_tag.lower() in void_tags and not is_closing):
                    pass
                elif is_closing:
                    if not stack:
                        print(f"Error: Unexpected closing tag </{current_tag}> at line {line_num}")
                    else:
                        last_tag, last_line = stack.pop()
                        if current_tag != last_tag:
                            print(f"Error: Mismatched tag </{current_tag}> at line {line_num}. Expected </{last_tag}> (opened at {last_line})")
                else:
                    stack.append((current_tag, tag_start_line))
                
                state = "NORMAL"
                current_tag = ""
                is_closing = False
                is_self_closing = False
                current_tag_finished = False
            elif char == '/' and brace_depth == 0:
                if i + 1 < len(content) and content[i+1] == '>':
                    is_self_closing = True
            elif not current_tag_finished and brace_depth == 0:
                if char not in ' \t\n/':
                    current_tag += char
                elif current_tag != "":
                    current_tag_finished = True
        
        elif state == "IN_STRING_DOUBLE":
            if char == '"' and content[max(0, i-1)] != '\\': state = "NORMAL"
        elif state == "IN_STRING_SINGLE":
            if char == "'" and content[max(0, i-1)] != '\\': state = "NORMAL"
        elif state == "IN_STRING_BACKTICK":
            if char == '`' and content[max(0, i-1)] != '\\': state = "NORMAL"
        elif state == "IN_COMMENT_LINE":
            if char == '\n': state = "NORMAL"
        elif state == "IN_COMMENT_BLOCK":
            if char == '*' and i + 1 < len(content) and content[i+1] == '/':
                state = "NORMAL"
                i += 1
        
        i += 1

    if stack:
        print("Error: Unclosed tags at EOF:")
        for tag, line in stack[-20:]:
            print(f"  <{tag}> opened at line {line}")
    else:
        print("JSX balance check passed!")

if __name__ == "__main__":
    check_jsx_balance('/Users/mattfinn/.gemini/antigravity/scratch/index.html', 41400)
