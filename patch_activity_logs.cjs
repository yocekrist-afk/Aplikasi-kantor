const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /try \{\s*await addDoc\(collection\(db, 'activity_logs'\), \{\s*type: 'participant',\s*message: \`Peserta menyelesaikan subtes \$\{subtestName\}\`,\s*timestamp: new Date\(\)\.toISOString\(\),\s*createdAt: serverTimestamp\(\)\s*\}\);\s*\} catch \(e\) \{\}/g,
  `try {
        if (participantId !== 'trial-user') {
          await addDoc(collection(db, 'activity_logs'), {
            type: 'participant',
            message: \`Peserta menyelesaikan subtes \${subtestName}\`,
            timestamp: new Date().toISOString(),
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {}`
);

content = content.replace(
  /try \{\s*await addDoc\(collection\(db, 'activity_logs'\), \{\s*type: 'participant',\s*message: \`Waktu habis! Peserta otomatis menyelesaikan subtes \$\{subtestName\}\`,\s*timestamp: new Date\(\)\.toISOString\(\),\s*createdAt: serverTimestamp\(\)\s*\}\);\s*\} catch \(e\) \{\}/g,
  `try {
          if (participantId !== 'trial-user') {
            await addDoc(collection(db, 'activity_logs'), {
              type: 'participant',
              message: \`Waktu habis! Peserta otomatis menyelesaikan subtes \${subtestName}\`,
              timestamp: new Date().toISOString(),
              createdAt: serverTimestamp()
            });
          }
        } catch (e) {}`
);

fs.writeFileSync(file, content);
