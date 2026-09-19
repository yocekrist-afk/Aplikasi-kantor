const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(Object.keys\(updates\).length > 0\) \{\s*\/\/ Batch write to Firebase ONLY on page turn\s*const pRef = doc\(db, 'participants', participantId\);\s*await updateDoc\(pRef, updates\);\s*\}/g,
  `if (Object.keys(updates).length > 0) {
        if (participantId === 'trial-user') {
          console.log('Simulasi mode: jawaban tidak disimpan ke server (page turn)');
        } else {
          // Batch write to Firebase ONLY on page turn
          const pRef = doc(db, 'participants', participantId);
          await updateDoc(pRef, updates);
        }
      }`
);

content = content.replace(
  /if \(Object.keys\(updates\).length > 0\) \{\s*const pRef = doc\(db, 'participants', participantId\);\s*await updateDoc\(pRef, updates\);\s*\}/g,
  `if (Object.keys(updates).length > 0) {
        if (participantId === 'trial-user') {
          console.log('Simulasi mode: jawaban tidak disimpan ke server (finish)');
        } else {
          const pRef = doc(db, 'participants', participantId);
          await updateDoc(pRef, updates);
        }
      }`
);

// We need to also patch the mark as completed logic
content = content.replace(
  /await updateDoc\(doc\(db, 'participants', participantId\), \{\s*\[\`completedTests\.\$\{subtestId\}\`\]: true\s*\}\);/g,
  `if (participantId !== 'trial-user') {
        await updateDoc(doc(db, 'participants', participantId), {
          [\`completedTests.\${subtestId}\`]: true
        });
      }`
);

fs.writeFileSync(file, content);
