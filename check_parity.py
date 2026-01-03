
import re

def check_parity(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        line_num = i + 1
        # Strip comments
        code = re.sub(r'//.*', '', line)
        code = re.sub(r'/\*.*?\*/', '', code)
        
        # Count quotes
        # We need to handle escaped quotes
        dq = len(re.findall(r'(?<!\\)"', code))
        sq = len(re.findall(r"(?<!\\)'", code))
        bt = len(re.findall(r'(?<!\\)`', code))
        
        if dq % 2 != 0:
            print(f"Line {line_num}: Odd number of double quotes ({dq})")
        if sq % 2 != 0:
            print(f"Line {line_num}: Odd number of single quotes ({sq})")
        if bt % 2 != 0:
            # Backticks often span lines, so this is common
            pass

if __name__ == "__main__":
    check_parity('/Users/mattfinn/.gemini/antigravity/scratch/index.html')
