import re

with open('src/pages/TabulasiPenilaian.tsx', 'r') as f:
    text = f.read()

# It might look like:
# import { 
#   scoreParticipant,
#   generatePsikogramPdf,
#   batchSyncParticipantScores,
# } from '../utils/scoringEngine';

text = text.replace("  generatePsikogramPdf,\n", "")

if 'generatePsikogramPdf' not in text.split("NormGuideView")[0]:
    text = text.replace(
        "import { NormGuideView } from '../components/NormGuideView';",
        "import { generatePsikogramPdf } from '../utils/psikogramGenerator';\nimport { NormGuideView } from '../components/NormGuideView';"
    )

with open('src/pages/TabulasiPenilaian.tsx', 'w') as f:
    f.write(text)

