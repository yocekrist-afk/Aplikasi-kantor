const fs = require('fs');
const file = 'src/pages/participant/ParticipantRegister.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add onSnapshot import
content = content.replace(
  "import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';",
  "import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';"
);

// Add state
content = content.replace(
  "  const [showCamera, setShowCamera] = useState(false);",
  "  const [showCamera, setShowCamera] = useState(false);\n  const [requireWebcam, setRequireWebcam] = React.useState(true);\n\n  React.useEffect(() => {\n    const unsub = onSnapshot(collection(db, 'app_settings'), (snapshot) => {\n      if (!snapshot.empty) {\n        const config = snapshot.docs[0].data();\n        if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);\n      }\n    });\n    return () => unsub();\n  }, []);"
);

// Update validation
content = content.replace(
  "// if (!formData.photoBase64) {\n    //   setError('Wajib mengambil foto profil dari kamera secara langsung (Real-time).');\n    //   return;\n    // }",
  "if (requireWebcam && !formData.photoBase64) {\n      setError('Wajib mengambil foto profil dari kamera secara langsung (Real-time).');\n      return;\n    }"
);

// Update label
content = content.replace(
  "Foto Diri (Real-time) - Opsional (Bisa dilewati)",
  "{requireWebcam ? 'Foto Diri (Real-time) *' : 'Foto Diri (Real-time) - Opsional'}"
);

fs.writeFileSync(file, content);
