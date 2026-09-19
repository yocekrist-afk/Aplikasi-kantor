import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# 1. Add PWAInstallButton import
if "import { PWAInstallButton }" not in text:
    text = text.replace(
        "import { ref,",
        "import { PWAInstallButton } from '../components/PWAInstallButton';\nimport { ref,"
    )

# 2. Add Smartphone icon
if "Smartphone" not in text:
    text = text.replace(
        "import { User, Shield, Bell, Paintbrush, Save, Loader2, Upload, X, Database, Download, AlertTriangle, FileCode } from 'lucide-react';",
        "import { User, Shield, Bell, Paintbrush, Save, Loader2, Upload, X, Database, Download, AlertTriangle, FileCode, Smartphone } from 'lucide-react';"
    )

# 3. Add tab button
tab_btn = """          <button 
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'database' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Database className="w-4 h-4" /> <span>Database</span>
          </button>
          <button 
            onClick={() => setActiveTab('pwa')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pwa' ? 'bg-[#8BC34A]/10 text-[#8BC34A]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Smartphone className="w-4 h-4" /> <span>Instalasi (PWA)</span>
          </button>"""

text = re.sub(
    r'<button\s*onClick=\{\(\) => setActiveTab\(\'database\'\)\}\s*className=\{`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors \$\{activeTab === \'database\' \? \'bg-\[\#8BC34A\]/10 text-\[\#8BC34A\]\' : \'text-gray-600 hover:bg-gray-100\'\}`\}\s*>\s*<Database className="w-4 h-4" /> <span>Database</span>\s*</button>',
    tab_btn,
    text
)

# 4. Add PWA tab content right before the end of the flex-1 container
pwa_content = """          {activeTab === 'pwa' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Instalasi Aplikasi Mandiri</h2>
                <p className="text-sm text-gray-500 mb-6">Instal Perspective sebagai aplikasi desktop (PC/Mac) atau aplikasi mobile (Android/iOS) yang berdiri sendiri.</p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1">Pasang ke Perangkat</h3>
                      <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                        Dengan menginstal aplikasi ini, Anda dapat membukanya langsung dari layar utama tanpa perlu mengetikkan URL di browser. Ini juga akan memberikan pengalaman layar penuh yang bebas dari gangguan saat digunakan untuk tes.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <PWAInstallButton />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
"""

text = re.sub(
    r'</div>\s*</div>\s*</div>\s*\)\s*\}', # This is a bit risky. Let's do a more robust replace for the end of the tabs
    r'</div>\n      </div>\n    </div>\n  );\n}', # Actually, let's find the end of the component return
    text
)

# A safer way to inject the new tab content:
text = text.replace(
    "          {activeTab === 'notifikasi' && (",
    "          {activeTab === 'pwa' && (\n            <div className=\"space-y-6 max-w-2xl\">\n              <div>\n                <h2 className=\"text-lg font-bold text-gray-900 mb-1\">Instalasi Aplikasi Mandiri</h2>\n                <p className=\"text-sm text-gray-500 mb-6\">Instal Perspective sebagai aplikasi desktop (PC/Mac) atau aplikasi mobile (Android/iOS) yang berdiri sendiri.</p>\n                <div className=\"bg-gray-50 border border-gray-200 rounded-xl p-5\">\n                  <div className=\"flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between\">\n                    <div>\n                      <h3 className=\"text-sm font-bold text-gray-800 mb-1\">Pasang ke Perangkat</h3>\n                      <p className=\"text-xs text-gray-500 max-w-md leading-relaxed\">\n                        Dengan menginstal aplikasi ini, Anda dapat membukanya langsung dari layar utama tanpa perlu mengetik URL di browser. Ini juga akan memberikan pengalaman layar penuh bebas distraksi.\n                      </p>\n                    </div>\n                    <div className=\"shrink-0 flex items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm\">\n                      <PWAInstallButton />\n                    </div>\n                  </div>\n                </div>\n              </div>\n            </div>\n          )}\n\n          {activeTab === 'notifikasi' && ("
)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(text)

