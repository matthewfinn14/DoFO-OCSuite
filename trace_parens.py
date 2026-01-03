
def trace_parens(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    
    # We will ignore common non-code blocks if possible, but for now simple check
    for i, line in enumerate(lines):
        # Strip comments? Minimal stripping for now.
        content = line.strip()
        # warning: strings/comments might mess this up, but it's a start
        
        for j, char in enumerate(line):
            if char == '(':
                stack.append((i + 1, j + 1, line))
            elif char == ')':
                if stack:
                    stack.pop()
                # If stack empty, we have extra closing paren (not the case here with +7 count)

    print(f"Total Unclosed Parentheses: {len(stack)}")
    if stack:
        print("First 10 unclosed parentheses locations:")
        for item in stack[:10]:
            print(f"Line {item[0]}: {item[2].strip()}")

if __name__ == "__main__":
    trace_parens('index.html')
