const fs = require('fs');
const file = 'src/pages/participant/ParticipantDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(\!participantData\?\.photoBase64\) \{\s*setShowWebcam\(true\);\s*\} else \{\s*setCurrentView\('tutorial'\);\s*\}/g,
  "// Bypass webcam check for testing\n                      setCurrentView('tutorial');"
);

fs.writeFileSync(file, content);
