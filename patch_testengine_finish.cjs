const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\/\/ Mark as completed\s*const pRef = doc\(db, 'participants', participantId\);\s*await updateDoc\(pRef, \{\s*\[\`completedTests\.\$\{subtestId\}\`\]: true\s*\}\);/g,
  `// Mark as completed
      if (participantId !== 'trial-user') {
        const pRef = doc(db, 'participants', participantId);
        await updateDoc(pRef, {
          [\`completedTests.\${subtestId}\`]: true
        });
      }`
);

fs.writeFileSync(file, content);
