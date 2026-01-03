
import re
import sys

file_path = '/Users/mattfinn/.gemini/antigravity/scratch/index.html'

def clean_code(code):
    # Remove single line comments
    code = re.sub(r'//.*', '', code)
    # Remove multi-line comments
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Remove strings (simple approximation)
    code = re.sub(r"'(?:\\'|[^'])*'", "''", code)
    code = re.sub(r'"(?:\\"|[^"])*"', '""', code)
    code = re.sub(r'`(?:\\`|[^`])*`', '``', code)
    return code

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1-based to 0-based
start_line = 29696 - 1
end_line = 30845

block = lines[start_line:end_line]
full_text = "".join(block)
cleaned_text = clean_code(full_text)

stack = []
pairs = {')': '(', ']': '[', '}': '{'}

for i, char in enumerate(cleaned_text):
    if char in '({[':
        stack.append((char, i))
    elif char in ')}]':
        if not stack:
            print(f"Stack empty at char index {i}. Unexpected closing '{char}'.")
            newlines = cleaned_text[:i].count('\n')
            print(f"Approx line offset in block: {newlines}")
            print(f"File line: {start_line + newlines + 1}")
            sys.exit(1)
        
        last_open, last_idx = stack.pop()
        expected = pairs[char]
        if last_open != expected:
            print(f"MISMATCH at index {i}. Found '{char}' but expected closing for '{last_open}'.")
            
            open_line_offset = cleaned_text[:last_idx].count('\n')
            conflict_line_offset = cleaned_text[:i].count('\n')
            
            print(f"Open '{last_open}' at block offset {open_line_offset} (File: {start_line + open_line_offset + 1})")
            print(f"Close '{char}' at block offset {conflict_line_offset} (File: {start_line + conflict_line_offset + 1})")
            sys.exit(1)

if stack:
    print(f"Stack not empty at end. Unclosed: {[x[0] for x in stack]}")
    last_open, last_idx = stack[0]
    line_offset = cleaned_text[:last_idx].count('\n')
    print(f"First unclosed '{last_open}' at block offset {line_offset} (File: {start_line + line_offset + 1})")
    sys.exit(1)
else:
    print("Full nesting is perfectly balanced.")
