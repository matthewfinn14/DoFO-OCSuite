
import sys

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    start_marker = '<script type="text/babel">'
    end_marker = '</script>'

    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Could not find Babel script block.")
        sys.exit(1)

    # Find the closing tag starting from the script start
    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print("Could not find closing script tag.")
        sys.exit(1)

    script_content = content[start_idx + len(start_marker):end_idx]
    
    braces = 0
    parens = 0
    
    lines = script_content.split('\n')
    line_offset = content[:start_idx + len(start_marker)].count('\n') + 1

    for i, line in enumerate(lines):
        current_line_num = line_offset + i
        for char in line:
            if char == '{': braces += 1
            if char == '}': braces -= 1
            if char == '(': parens += 1
            if char == ')': parens -= 1
        
        if braces < 0:
            print(f"Error: Negative brace count at line {current_line_num}")
            print(f"Line content: {line.strip()}")
            sys.exit(1)

    print(f"Final Balances - Braces: {braces}, Parens: {parens}")
    
    if braces != 0:
        print("ERROR: Braces are not balanced!")
        sys.exit(1)
    else:
        print("SUCCESS: Braces are balanced.")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
