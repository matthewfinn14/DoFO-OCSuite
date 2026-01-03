
import re

def remove_comments_and_strings(content):
    # Regex to remove comments and strings
    # This is a basic approximation for JS
    # 1. Strings: "..." or '...' or `...`
    # 2. Block comments: /* ... */
    # 3. Line comments: // ...
    
    # Placeholder for strings/comments to avoid removing braces inside them
    pattern = r"(\".*?\"|'.*?'|`[\s\S]*?`|/\*[\s\S]*?\*/|//.*?$)"
    # We use a callback to replace matches with empty strings (or newlines for line comments to keep line count?)
    # Actually just replacing with space is safer to avoid joining tokens.
    
    def replacer(match):
        return " "
        
    return re.sub(pattern, replacer, content, flags=re.MULTILINE)

with open('/Users/mattfinn/.gemini/antigravity/scratch/index.html', 'r') as f:
    lines = f.readlines()

# Extract ProgramDashboard
start_line = 29696 - 1
end_line = 30845 - 1
content = "".join(lines[start_line:end_line+1])

cleaned = remove_comments_and_strings(content)

curly_open = cleaned.count('{')
curly_close = cleaned.count('}')
paren_open = cleaned.count('(')
paren_close = cleaned.count(')')

print(f"Lines: {start_line+1}-{end_line+1}")
print(f"Curly: Open={curly_open}, Close={curly_close}, Diff={curly_open-curly_close}")
print(f"Paren: Open={paren_open}, Close={paren_close}, Diff={paren_open-paren_close}")

# Debug: Print last 500 chars of cleaned to see if anything weird remains
print("\n--- Last 500 chars of CLEANED ---")
print(cleaned[-500:])
