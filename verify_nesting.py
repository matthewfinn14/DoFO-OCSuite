
import re

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
for i, char in enumerate(cleaned_text):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Stack empty at char index {i}. Unexpected closing brace.")
            # Find line number roughly
            newlines = cleaned_text[:i].count('\n')
            print(f"Approx line offset: {newlines}")
            exit(1)
        stack.pop()

if stack:
    print(f"Stack not empty at end. Unclosed braces count: {len(stack)}")
    print(f"First unclosed brace at char index {stack[0]}")
    newlines = cleaned_text[:stack[0]].count('\n')
    print(f"Approx line offset: {newlines}")
else:
    print("Nesting is perfectly balanced.")
