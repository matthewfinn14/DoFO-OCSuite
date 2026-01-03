
def check_quotes(filename):
    with open(filename, 'r') as f:
        content = f.read()

    in_quote = None
    start_pos = -1

    i = 0
    while i < len(content):
        char = content[i]
        
        # Skip escapes
        if char == '\\':
            i += 2
            continue
            
        if in_quote:
            if char == in_quote:
                in_quote = None
        else:
            if char in "\"'`":
                in_quote = char
                start_pos = i
        i += 1
        
    if in_quote:
        # Calculate line and col
        prefix = content[:start_pos]
        line = prefix.count('\n') + 1
        col = len(prefix) - prefix.rfind('\n')
        print(f"Error: Unclosed {in_quote} starting at line {line}, col {col}")
        
        # Print context from the file
        lines = content.split('\n')
        for l in range(max(0, line-2), min(len(lines), line+2)):
            print(f"{l+1}: {lines[l]}")
    else:
        print("Quote check passed!")

if __name__ == "__main__":
    check_quotes('/Users/mattfinn/.gemini/antigravity/scratch/index.html')
