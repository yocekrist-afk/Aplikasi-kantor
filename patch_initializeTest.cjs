const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const initializeTest = async \(\) => \{\s*try \{\s*const pRef = doc\(db, 'participants', participantId\);\s*const pSnap = await getDoc\(pRef\);/g,
  `const initializeTest = async () => {
      try {
        if (participantId === 'trial-user') {
          let startTime = Date.now();
          const elapsedMs = Date.now() - startTime;
          const remainingMs = Math.max(0, (timeLimitMinutes * 60 * 1000) - elapsedMs);
          setTimeLeft(Math.floor(remainingMs / 1000));
          return;
        }

        const pRef = doc(db, 'participants', participantId);
        const pSnap = await getDoc(pRef);`
);

fs.writeFileSync(file, content);
