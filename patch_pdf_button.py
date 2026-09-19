import re

with open('src/pages/TabulasiPenilaian.tsx', 'r') as f:
    text = f.read()

# Add import for generatePsikogramPdf
text = text.replace(
    "import { \n  scoreParticipant,",
    "import { \n  scoreParticipant,\n  generatePsikogramPdf,"
)

# If the above fails because of spacing, just add it directly at the end of the imports
if 'generatePsikogramPdf' not in text:
    text = text.replace(
        "import { NormGuideView } from '../components/NormGuideView';",
        "import { generatePsikogramPdf } from '../utils/psikogramGenerator';\nimport { NormGuideView } from '../components/NormGuideView';"
    )

replacement = """              <div className="flex items-center gap-2">
                <button
                  onClick={() => generatePsikogramPdf(inspectParticipant)}
                  className="px-3 py-1.5 text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center gap-2"
                  title="Unduh PDF Psikogram"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak PDF</span>
                </button>
                <button
                  onClick={() => setShowManualCorrectionModal(true)}
                  className="px-3 py-1.5 text-sm font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg flex items-center gap-2"
                  title="Panel Koreksi Manual"
                >"""

text = re.sub(
    r'<div className="flex items-center gap-2">\s*<button\s*onClick=\{\(\) => setShowManualCorrectionModal\(true\)\}\s*className="px-3 py-1.5 text-sm font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg flex items-center gap-2"\s*title="Panel Koreksi Manual"\s*>',
    replacement,
    text
)

with open('src/pages/TabulasiPenilaian.tsx', 'w') as f:
    f.write(text)

