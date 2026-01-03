const fs = require('fs');

try {
    const content = fs.readFileSync('index.html', 'utf8');

    // Extract the Babel script content
    const scriptStart = content.indexOf('<script type="text/babel">');
    const scriptEnd = content.indexOf('</script>', scriptStart);

    if (scriptStart === -1 || scriptEnd === -1) {
        console.error('Could not find Babel script block.');
        process.exit(1);
    }

    const scriptContent = content.substring(scriptStart + 26, scriptEnd);

    // Simple check for unclosed braces/parens by counting
    // (A full Babel parser would be better, but we can't assume dependencies are installed)
    let braces = 0;
    let parens = 0;
    const lines = scriptContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '{') braces++;
            if (char === '}') braces--;
            if (char === '(') parens++;
            if (char === ')') parens--;
        }
        if (braces < 0) {
            console.error(`Error: Unclosed brace '}' at line ${i + scriptStart + 26 + 1}`);
            process.exit(1);
        }
        if (parens < 0) {
            // Ignore negative parens for now as text might contain ')'
            // console.error(`Error: Unclosed paren at line ${i + scriptStart + 26 + 1}`);
        }
    }

    console.log(`Final Balances - Braces: ${braces}, Parens: ${parens}`);

    if (braces !== 0) console.error('ERROR: Braces are not balanced!');
    else console.log('SUCCESS: Braces are balanced.');

} catch (err) {
    console.error('Error reading file:', err);
}
