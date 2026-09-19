const fs = require('fs');
const file = 'src/pages/Pengaturan.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(
  "const [logoUrlInput, setLogoUrlInput] = useState('');",
  "const [logoUrlInput, setLogoUrlInput] = useState('');\n  const [requireWebcam, setRequireWebcam] = useState(true);"
);

// 2. Add to useEffect
content = content.replace(
  "if (config.logoUrl) setLogoUrl(config.logoUrl);",
  "if (config.logoUrl) setLogoUrl(config.logoUrl);\n      if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);"
);

// 3. Add to payload
content = content.replace(
  "const payload = { appName, adminEmail, appDescription, logoUrl };",
  "const payload = { appName, adminEmail, appDescription, logoUrl, requireWebcam };"
);

// 4. Add UI to 'keamanan'
const uiCode = `
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Verifikasi Peserta (Anti-Kecurangan)</h2>
                <p className="text-sm text-gray-500 mb-4">Atur apakah peserta diwajibkan untuk melakukan selfie (foto wajah realtime) sebelum tes dan saat registrasi.</p>
                
                <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={requireWebcam} onChange={(e) => setRequireWebcam(e.target.checked)} />
                    <div className={\`block w-10 h-6 rounded-full transition-colors \${requireWebcam ? 'bg-[#8BC34A]' : 'bg-gray-300'}\`}></div>
                    <div className={\`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${requireWebcam ? 'transform translate-x-4' : ''}\`}></div>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-800 text-sm">Wajib Selfie (Webcam)</div>
                    <div className="text-xs text-gray-500">{requireWebcam ? 'Aktif. Peserta wajib foto wajah langsung.' : 'Nonaktif. Peserta bisa mendaftar & tes tanpa kamera.'}</div>
                  </div>
                </label>
              </div>
`;

content = content.replace(
  "              <div className=\"flex justify-end pt-4\">",
  uiCode + "\n              <div className=\"flex justify-end pt-4\">"
);

// Replace button for saving in keamanan (currently it just says "Update Password", let's change it to save everything like handleSave, or just handleSave.
content = content.replace(
  /button className="flex items-center space-x-2 bg-\[\#1C1C1C\] hover:bg-black text-white px-6 py-2\.5 rounded-lg text-sm font-bold transition-colors">/g,
  `button onClick={handleSave} className="flex items-center space-x-2 bg-[#1C1C1C] hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">`
);


fs.writeFileSync(file, content);
