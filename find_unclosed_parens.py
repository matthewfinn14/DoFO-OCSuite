
import sys

def check_parens(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    for i, line in enumerate(lines):
        line_content = line.strip()
        for j, char in enumerate(line):
            if char == '(':
                stack.append((i + 1, j + 1, line_content))
            elif char == ')':
                if stack:
                    stack.pop()

    print(f"Unclosed parentheses: {len(stack)}")
    for item in stack:
        print(f"Line {item[0]}: {item[2]}")

if __name__ == "__main__":
    check_parens('index.html')
