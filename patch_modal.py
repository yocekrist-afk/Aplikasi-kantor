import re

with open('src/components/ManualCorrectionModal.tsx', 'r') as f:
    text = f.read()

# Add RotateCcw icon import
text = text.replace(
    "import { X, CheckCircle2, Save, FileEdit, AlertCircle } from 'lucide-react';",
    "import { X, CheckCircle2, Save, FileEdit, AlertCircle, RotateCcw } from 'lucide-react';"
)

# Add "Reset Semua di Subtes Ini" button to the subtest header
subtest_header_replacement = """              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLocalOverrides(prev => {
                      const next = { ...prev };
                      delete next[activeSubtest];
                      return next;
                    });
                  }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Subtes Ini</span>
                </button>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Setiap perubahan akan menimpa skor sistem.</span>
                </div>
              </div>"""

text = re.sub(
    r'<div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">\s*<AlertCircle className="w-3.5 h-3.5" />\s*<span>Setiap perubahan akan segera menimpa skor sistem.</span>\s*</div>',
    subtest_header_replacement,
    text
)

# Add "Kembalikan ke Nilai Sistem Asli" button to the footer
footer_replacement = """        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-between gap-3">
          <button
            onClick={() => {
              setLocalOverrides({});
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Kembalikan ke Nilai Sistem Asli
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <span className="animate-pulse">Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Override
                </>
              )}
            </button>
          </div>
        </div>"""

text = re.sub(
    r'\{/\* Footer \*/\}\s*<div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end gap-3">\s*<button\s*onClick=\{onClose\}\s*className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"\s*>\s*Batal\s*</button>\s*<button\s*onClick=\{handleSave\}\s*disabled=\{isSaving\}\s*className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"\s*>\s*\{isSaving \? \(\s*<span className="animate-pulse">Menyimpan\.\.\.</span>\s*\) : \(\s*<>\s*<Save className="w-4 h-4" />\s*Simpan Override\s*</>\s*\)\}\s*</button>\s*</div>',
    footer_replacement,
    text
)

with open('src/components/ManualCorrectionModal.tsx', 'w') as f:
    f.write(text)

