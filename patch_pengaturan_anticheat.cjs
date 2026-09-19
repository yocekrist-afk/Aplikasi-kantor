const fs = require('fs');
const file = 'src/pages/Pengaturan.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
content = content.replace(
  "const [requireWebcam, setRequireWebcam] = useState(true);",
  "const [requireWebcam, setRequireWebcam] = useState(true);\n  const [requireAntiCheat, setRequireAntiCheat] = useState(true);"
);

// 2. Add to useEffect
content = content.replace(
  "if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);",
  "if (config.requireWebcam !== undefined) setRequireWebcam(config.requireWebcam);\n      if (config.requireAntiCheat !== undefined) setRequireAntiCheat(config.requireAntiCheat);"
);

// 3. Add to payload
content = content.replace(
  "const payload = { appName, adminEmail, appDescription, logoUrl, requireWebcam };",
  "const payload = { appName, adminEmail, appDescription, logoUrl, requireWebcam, requireAntiCheat };"
);

// 4. Add UI to 'keamanan'
const uiCode = `
                <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors mt-3">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={requireAntiCheat} onChange={(e) => setRequireAntiCheat(e.target.checked)} />
                    <div className={\`block w-10 h-6 rounded-full transition-colors \${requireAntiCheat ? 'bg-[#8BC34A]' : 'bg-gray-300'}\`}></div>
                    <div className={\`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${requireAntiCheat ? 'transform translate-x-4' : ''}\`}></div>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-800 text-sm">Anti-Capture & Copy (Proteksi Soal)</div>
                    <div className="text-xs text-gray-500">{requireAntiCheat ? 'Aktif. Mencegah klik kanan, block teks, dan screenshot.' : 'Nonaktif. Peserta dapat memblok teks dan klik kanan.'}</div>
                  </div>
                </label>
`;

content = content.replace(
  "</div>\n                  </div>\n                </label>\n              </div>\n              <div className=\"flex justify-end pt-4\">",
  "</div>\n                  </div>\n                </label>" + uiCode + "\n              </div>\n              <div className=\"flex justify-end pt-4\">"
);

content = content.replace(
  "<span>Update Password</span>",
  "<span>Simpan Pengaturan Keamanan</span>"
);

fs.writeFileSync(file, content);
