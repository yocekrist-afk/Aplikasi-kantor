const fs = require('fs');

const tsFile = fs.readFileSync('src/pages/participant/TestEngine.tsx', 'utf8');
const keyFile = fs.readFileSync('src/utils/istAnswerKeys.ts', 'utf8');

function extractOptions(code, varName) {
    const startIdx = code.indexOf(`const ${varName} = [`);
    if (startIdx === -1) return null;
    let endIdx = startIdx + `const ${varName} = [`.length;
    let bracketCount = 1;
    while (bracketCount > 0 && endIdx < code.length) {
        if (code[endIdx] === '[') bracketCount++;
        if (code[endIdx] === ']') bracketCount--;
        endIdx++;
    }
    const arrStr = code.substring(startIdx + `const ${varName} = `.length, endIdx);
    try {
        return eval(arrStr);
    } catch (e) {
        console.error("Failed to eval", varName);
        return null;
    }
}

function extractKeys(code, varName) {
    const startIdx = code.indexOf(`export const ${varName}: MultipleChoiceKey[] = [`);
    if (startIdx === -1) return null;
    let endIdx = startIdx + `export const ${varName}: MultipleChoiceKey[] = [`.length;
    let bracketCount = 1;
    while (bracketCount > 0 && endIdx < code.length) {
        if (code[endIdx] === '[') bracketCount++;
        if (code[endIdx] === ']') bracketCount--;
        endIdx++;
    }
    const arrStr = code.substring(startIdx + `export const ${varName}: MultipleChoiceKey[] = `.length, endIdx);
    const jsonStr = arrStr.replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"');
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        try {
            return eval(arrStr);
        } catch(e2) {
            console.error("Failed to eval keys", varName);
            return null;
        }
    }
}

const tests = [
    { name: 'Subtes 2 (WA)', opts: extractOptions(tsFile, 'waOptions'), keys: extractKeys(keyFile, 'SUBTEST2_WA_KEYS') },
    { name: 'Subtes 3 (AN)', opts: extractOptions(tsFile, 'anOptions'), keys: extractKeys(keyFile, 'SUBTEST3_AN_KEYS') },
    { name: 'Subtes 9 (ME)', opts: [extractOptions(tsFile, '["kesenian", "binatang", "perkakas", "burung", "bunga"]')], keys: extractKeys(keyFile, 'SUBTEST9_ME_KEYS') },
];

const letters = ['a', 'b', 'c', 'd', 'e'];

tests.forEach(test => {
    console.log(`\n=== AUDIT ${test.name} ===`);
    if (!test.keys) {
        console.log("Keys not found.");
        return;
    }
    if (!test.opts) {
        console.log("Options not found.");
        return;
    }
    
    let errorCount = 0;
    test.keys.forEach((key, i) => {
        // ME has the same options for all questions
        const options = test.name.includes('ME') ? ["kesenian", "binatang", "perkakas", "burung", "bunga"] : test.opts[i];
        if (!options) {
            console.log(`No ${key.no}: Options missing.`);
            return;
        }
        
        let matchIdx = options.findIndex(opt => opt.toLowerCase() === key.text.toLowerCase());
        if (matchIdx === -1 && key.text.toLowerCase() === 'sutera') {
            matchIdx = options.findIndex(opt => opt.toLowerCase() === 'sutra');
        }
        
        const actualLetter = matchIdx > -1 ? letters[matchIdx] : 'NOT_FOUND';
        
        if (key.letter !== actualLetter) {
            console.log(`No ${key.no}: Kunci '${key.letter}' (${key.text}). Di Layar: '${actualLetter}'. Opsi: [${options.join(', ')}]`);
            errorCount++;
        }
    });
    console.log(`Total Mismatch: ${errorCount} soal.`);
});

