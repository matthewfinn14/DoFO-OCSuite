
import re

def check_balance(filename, start_line):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    start_index = max(0, start_line - 1)
    
    print(f"Checking lines {start_line} to {len(lines)}...")

    for i in range(start_index, len(lines)):
        line = lines[i]
        line_num = i + 1
        
        # Strip string literals safely to avoid false positives in comments/brackets
        # This is a bit recursive/tricky, but let's try basic stripping first
        code = re.sub(r"'.*?'", "''", line)
        code = re.sub(r'".*?"', '""', code)
        code = re.sub(r'//.*', '', code)
        code = re.sub(r'/\*.*?\*/', '', code)

        for char in code:
            if char in '({[':
                stack.append((char, line_num))
            elif char in ')}]':
                if not stack:
                    print(f"Error: Mismatched '{char}' at line {line_num}. No opening delimiter.")
                    return
                
                last_open, last_line = stack.pop()
                expected = {'(': ')', '{': '}', '[': ']'}[last_open]
                
                if char != expected:
                    print(f"Error: Mismatched '{char}' at line {line_num}. Expected '{expected}' (opened at {last_line})")
                    return

    if stack:
        print("Error: Unclosed delimiters at EOF:")
        for char, line in stack[-10:]:
            print(f"  '{char}' opened at line {line}")
    else:
        print("Balance check passed! No unclosed delimiters.")

if __name__ == "__main__":
    check_balance('/Users/mattfinn/.gemini/antigravity/scratch/index.html', 785)
