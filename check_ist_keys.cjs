const fs = require('fs');

const tsFile = fs.readFileSync('src/pages/participant/TestEngine.tsx', 'utf8');
const keyFile = fs.readFileSync('src/utils/istAnswerKeys.ts', 'utf8');

// Function to extract options from TestEngine
function extractOptions(code, varName) {
  const regex = new RegExp(`const ${varName} = \\[(\\s*\\[.*\\],?\\s*)*\\];`);
  const match = code.match(regex);
  if (!match) {
      // Use eval approach safely for this specific file format if regex fails
      const startIdx = code.indexOf(`const ${varName} = [`);
      const endIdx = code.indexOf(`];`, startIdx);
      if (startIdx > -1 && endIdx > -1) {
          const arrStr = code.substring(startIdx + `const ${varName} = `.length, endIdx + 1);
          return eval(arrStr);
      }
      return null;
  }
}

const waOptions = extractOptions(tsFile, 'waOptions');
const anOptions = extractOptions(tsFile, 'anOptions');

// Function to extract keys
function extractKeys(code, varName) {
    const startIdx = code.indexOf(`export const ${varName}: MultipleChoiceKey[] = [`);
    const endIdx = code.indexOf(`];`, startIdx);
    if (startIdx > -1 && endIdx > -1) {
        const arrStr = code.substring(startIdx + `export const ${varName}: MultipleChoiceKey[] = `.length, endIdx + 1);
        // Using eval, but replacing object literal keys without quotes
        // We know it's relatively safe here
        const jsonStr = arrStr.replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"');
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            // fallback eval
            return eval(arrStr);
        }
    }
    return null;
}

const waKeys = extractKeys(keyFile, 'SUBTEST2_WA_KEYS');
const anKeys = extractKeys(keyFile, 'SUBTEST3_AN_KEYS');

const letters = ['a', 'b', 'c', 'd', 'e'];

console.log("=== AUDIT SUBTES 2 (WA) ===");
waKeys.forEach((key, i) => {
    const options = waOptions[i];
    // Find the option index that matches the key text (case insensitive)
    const matchIdx = options.findIndex(opt => opt.toLowerCase() === key.text.toLowerCase());
    const actualLetter = matchIdx > -1 ? letters[matchIdx] : 'NOT_FOUND';
    
    if (key.letter !== actualLetter) {
        console.log(`No ${key.no}: Kunci '${key.letter}' (${key.text}). Di Layar: '${actualLetter}'. Opsi: [${options.join(', ')}]`);
    }
});

console.log("\n=== AUDIT SUBTES 3 (AN) ===");
anKeys.forEach((key, i) => {
    const options = anOptions[i];
    const matchIdx = options.findIndex(opt => opt.toLowerCase() === key.text.toLowerCase() || opt.toLowerCase() === key.text.toLowerCase().replace('sutera', 'sutra'));
    const actualLetter = matchIdx > -1 ? letters[matchIdx] : 'NOT_FOUND';
    
    if (key.letter !== actualLetter) {
        console.log(`No ${key.no}: Kunci '${key.letter}' (${key.text}). Di Layar: '${actualLetter}'. Opsi: [${options.join(', ')}]`);
    }
});
