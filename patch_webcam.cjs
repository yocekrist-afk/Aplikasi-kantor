const fs = require('fs');
const file = 'src/pages/participant/ParticipantRegister.tsx';
let content = fs.readFileSync(file, 'utf8');

// Bypass validation
content = content.replace(
  "if (!formData.photoBase64) {\n      setError('Wajib mengambil foto profil dari kamera secara langsung (Real-time).');\n      return;\n    }",
  "// if (!formData.photoBase64) {\n    //   setError('Wajib mengambil foto profil dari kamera secara langsung (Real-time).');\n    //   return;\n    // }"
);

// Optionalize label
content = content.replace(
  "Foto Diri (Real-time) *",
  "Foto Diri (Real-time) - Opsional (Bisa dilewati)"
);

fs.writeFileSync(file, content);
