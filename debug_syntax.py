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
if start_idx == -1:
    print("Script tag not found")
    sys.exit(1)

content_start = start_idx + len(script_start_marker)
end_idx = html.find(script_end_marker, content_start)

if end_idx == -1:
    print("Script end tag not found")
    sys.exit(1)

script_content = html[content_start:end_idx]

brace_count = 0
paren_count = 0
lines = script_content.split('\n')

for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
        elif char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
    
    if brace_count < 0:
        print(f"Negative brace count at line {i + 1}: {line.strip()}")
    if paren_count < 0:
        print(f"Negative paren count at line {i + 1}: {line.strip()}")

print(f"Final Brace Count: {brace_count}")
print(f"Final Paren Count: {paren_count}")
