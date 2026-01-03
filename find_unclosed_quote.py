
with open('/Users/mattfinn/.gemini/antigravity/scratch/index.html', 'r') as f:
    lines = f.readlines()

start_line = 29696 - 1
end_line = 30845 - 1

for i in range(start_line, end_line + 1):
    line = lines[i]
    # Simple check: odd number of single quotes
    # NOTE: This is heuristic. Escaped quotes \' should be ignored.
    # We replace \' with nothing to avoid counting them
    cleaned = line.replace("\\'", "")
    count = cleaned.count("'")
    if count % 2 != 0:
        print(f"Line {i+1}: {line.strip()} (Count: {count})")
