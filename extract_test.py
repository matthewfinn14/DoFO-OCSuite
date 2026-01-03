
import os

file_path = '/Users/mattfinn/.gemini/antigravity/scratch/index.html'
out_path = '/Users/mattfinn/.gemini/antigravity/scratch/test_syntax.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract ProgramDashboard + GAME_PLAN_LAYOUTS
# Start 29696, End 30935
start_line = 29696 - 1
end_line = 30935

block = lines[start_line:end_line]

content = "const App = () => {\n" + "".join(block) + "\n};"

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Created test_syntax.js")
