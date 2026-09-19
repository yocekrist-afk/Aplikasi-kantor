const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

// Patch 1: Start timer
content = content.replace(
  /startTime = Date\.now\(\);\s*await updateDoc\(pRef, \{\s*\[\`testTimers\.\$\{subtestId\}\`\]: startTime\s*\}\);/g,
  `startTime = Date.now();
            if (participantId !== 'trial-user') {
              await updateDoc(pRef, {
                [\`testTimers.\${subtestId}\`]: startTime
              });
            }`
);

// Patch 2: Time up
content = content.replace(
  /await saveCurrentPage\(\);\s*const pRef = doc\(db, 'participants', participantId\);\s*await updateDoc\(pRef, \{\s*\[\`completedTests\.\$\{subtestId\}\`\]: true\s*\}\);/g,
  `await saveCurrentPage();
        if (participantId !== 'trial-user') {
          const pRef = doc(db, 'participants', participantId);
          await updateDoc(pRef, {
            [\`completedTests.\${subtestId}\`]: true
          });
        }`
);

fs.writeFileSync(file, content);
