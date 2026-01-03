const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptStartMarker = '<script type="text/babel">';
const scriptEndMarker = '</script>';

const startIdx = html.indexOf(scriptStartMarker);
if (startIdx === -1) {
    console.error("Script tag not found");
    process.exit(1);
}

const contentStart = startIdx + scriptStartMarker.length;
const endIdx = html.indexOf(scriptEndMarker, contentStart);

if (endIdx === -1) {
    console.error("Script end tag not found");
    process.exit(1);
}

const scriptContent = html.substring(contentStart, endIdx);

// Basic brace counting
let braceCount = 0;
let parenCount = 0;
let lines = scriptContent.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
    }
    if (braceCount < 0) {
        console.log(`Negative brace count at line ${i + 1}: ${line.trim()}`);
    }
    if (parenCount < 0) {
        console.log(`Negative paren count at line ${i + 1}: ${line.trim()}`);
    }
}

console.log(`Final Brace Count: ${braceCount}`);
console.log(`Final Paren Count: ${parenCount}`);
