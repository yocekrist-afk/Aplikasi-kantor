const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add onSnapshot to imports
content = content.replace(
  "import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';",
  "import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';"
);

// Modify the anticheat useEffect
content = content.replace(
  "useEffect(() => {\n    // 1. Prevent Right Click",
  `useEffect(() => {
    let unsubscribe = () => {};
    let isAntiCheatActive = true;

    unsubscribe = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
      if (!snapshot.empty) {
        const configDocs = snapshot.docs.filter(d => d.id !== 'durasi_tes');
        if (configDocs.length > 0) {
          const config = configDocs[0].data();
          if (config.requireAntiCheat !== undefined) {
             isAntiCheatActive = config.requireAntiCheat;
             if (!isAntiCheatActive) {
                // If turned off dynamically, remove protections
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('copy', handleCopyPaste);
                document.removeEventListener('cut', handleCopyPaste);
                document.removeEventListener('paste', handleCopyPaste);
                document.removeEventListener('keydown', handlePrint);
                if (document.head.contains(style)) {
                   document.head.removeChild(style);
                }
             } else {
                // If turned on dynamically, add protections
                document.addEventListener('contextmenu', handleContextMenu);
                document.addEventListener('copy', handleCopyPaste);
                document.addEventListener('cut', handleCopyPaste);
                document.addEventListener('paste', handleCopyPaste);
                document.addEventListener('keydown', handlePrint);
                if (!document.head.contains(style)) {
                   document.head.appendChild(style);
                }
             }
          }
        }
      }
    });

    // 1. Prevent Right Click`
);

// We need to wrap the handlers and styles so they are accessible by the closure
content = content.replace(
  "    const handleContextMenu = (e: MouseEvent) => {",
  "    const handleContextMenu = (e: MouseEvent) => {\n      if (!isAntiCheatActive) return;"
);

content = content.replace(
  "    const handleCopyPaste = (e: ClipboardEvent) => {",
  "    const handleCopyPaste = (e: ClipboardEvent) => {\n      if (!isAntiCheatActive) return;"
);

content = content.replace(
  "    const handlePrint = (e: KeyboardEvent) => {",
  "    const handlePrint = (e: KeyboardEvent) => {\n      if (!isAntiCheatActive) return;"
);

// Remove the initial manual event listener attachments, as they are handled by the logic above (we default it to true anyway but let's let the snapshot handler do it to be safe, or just keep it and let snapshot toggle it).
content = content.replace(
  "    document.addEventListener('contextmenu', handleContextMenu);\n    document.addEventListener('copy', handleCopyPaste);\n    document.addEventListener('cut', handleCopyPaste);\n    document.addEventListener('paste', handleCopyPaste);\n    document.addEventListener('keydown', handlePrint);\n    \n    // Add CSS protection dynamically",
  "    // Attach initially assuming true, snapshot will correct it if false\n    document.addEventListener('contextmenu', handleContextMenu);\n    document.addEventListener('copy', handleCopyPaste);\n    document.addEventListener('cut', handleCopyPaste);\n    document.addEventListener('paste', handleCopyPaste);\n    document.addEventListener('keydown', handlePrint);\n    \n    // Add CSS protection dynamically"
);

content = content.replace(
  "    return () => {",
  "    return () => {\n      unsubscribe();"
);

fs.writeFileSync(file, content);
