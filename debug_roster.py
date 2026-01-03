import sys

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        lines = f.readlines()
except FileNotFoundError:
    print("index.html not found")
    sys.exit(1)

# Lines are 0-indexed in list, but we use 1-based logic
start_line = 12116 - 1
end_line = 12609

chunk = lines[start_line:end_line+1]

# Cleaner logic (stripped down)
def clean_line(text):
    clean = []
    in_tag = False # Naive JSX tag skipper? No, parens inside tags matter
    # Just basic char loop
    i = 0
    while i < len(text):
        char = text[i]
        clean.append(char) # Keep everything for now, manual inspection of output
        i += 1
    return "".join(clean)

paren_count = 0
stack = []

for i, line in enumerate(chunk):
    # Check for comments
    clean = line
    if '//' in clean: clean = clean.split('//')[0]
    
    for char in clean:
        if char == '(':
            paren_count += 1
            stack.append(start_line + i + 1)
        elif char == ')':
            paren_count -= 1
            if stack:
                stack.pop()

print(f"Paren Count in chunk: {paren_count}")
if stack:
    print(f"First unclosed paren at: {stack[0]}")
    print(lines[stack[0]-1].strip())
