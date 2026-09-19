import re

with open('src/pages/TabulasiPenilaian.tsx', 'r') as f:
    text = f.read()

replacement = """              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManualCorrectionModal(true)}
                  className="px-3 py-1.5 text-sm font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg flex items-center gap-2"
                  title="Panel Koreksi Manual"
                >
                  <FileEdit className="w-4 h-4" />
                  <span className="hidden sm:inline">Koreksi Manual</span>
                </button>
                <button
                  onClick={() => setInspectParticipant(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>"""

text = re.sub(
    r'<button\s*onClick=\{\(\) => setInspectParticipant\(null\)\}\s*className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"\s*>\s*<X className="w-5 h-5" />\s*</button>',
    replacement,
    text
)

with open('src/pages/TabulasiPenilaian.tsx', 'w') as f:
    f.write(text)

