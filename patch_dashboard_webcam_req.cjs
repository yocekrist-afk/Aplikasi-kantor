const fs = require('fs');
const file = 'src/pages/participant/ParticipantDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state
content = content.replace(
  "const [isSimulasiMode, setIsSimulasiMode] = useState(false);",
  "const [isSimulasiMode, setIsSimulasiMode] = useState(false);\n  const [requireWebcam, setRequireWebcam] = useState(true);"
);

// Add to useEffect
content = content.replace(
  "let unsubscribeDurasi = () => {};",
  "let unsubscribeDurasi = () => {};\n    let unsubscribeApp = () => {};"
);

content = content.replace(
  "const durasiRef = doc(db, \"app_settings\", \"durasi_tes\");",
  `unsubscribeApp = onSnapshot(collection(db, 'app_settings'), (snapshot) => {
          if (!snapshot.empty) {
            const configDocs = snapshot.docs.filter(d => d.id !== 'durasi_tes');
            if (configDocs.length > 0) {
              const config = configDocs[0].data();
              if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);
            }
          }
        });
        
        const durasiRef = doc(db, "app_settings", "durasi_tes");`
);

// Update bypass logic
// from: 
// // Bypass webcam check for testing
// setCurrentView('tutorial');
// to:
// if (requireWebcam && !participantData?.photoBase64) { setShowWebcam(true); } else { setCurrentView('tutorial'); }

content = content.replace(
  "// Bypass webcam check for testing\n                      setCurrentView('tutorial');",
  "if (requireWebcam && !participantData?.photoBase64) { setShowWebcam(true); } else { setCurrentView('tutorial'); }"
);


fs.writeFileSync(file, content);
