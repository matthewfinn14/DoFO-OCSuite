
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

open_braces = cleaned_text.count('{')
close_braces = cleaned_text.count('}')

print(f"Checking lines {start_line+1} to {end_line}")
print(f"Open Braces: {open_braces}")
print(f"Close Braces: {close_braces}")

if open_braces != close_braces:
    print(f"MISMATCH: Diff = {open_braces - close_braces}")
else:
    print("Braces are balanced.")

# Check parentheses too
open_parens = cleaned_text.count('(')
close_parens = cleaned_text.count(')')
print(f"Open Parens: {open_parens}")
print(f"Close Parens: {close_parens}")

if open_parens != close_parens:
    print(f"MISMATCH: Parens Diff = {open_parens - close_parens}")
