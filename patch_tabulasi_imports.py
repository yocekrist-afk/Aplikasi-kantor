import re

with open('src/pages/TabulasiPenilaian.tsx', 'r') as f:
    text = f.read()

text = text.replace(
    "import { Subtest4GeEvaluatorModal } from '../components/Subtest4GeEvaluatorModal';",
    "import { Subtest4GeEvaluatorModal } from '../components/Subtest4GeEvaluatorModal';\nimport { ManualCorrectionModal } from '../components/ManualCorrectionModal';"
)

text = text.replace(
    "const [showGeEvaluatorModal, setShowGeEvaluatorModal] = useState(false);",
    "const [showGeEvaluatorModal, setShowGeEvaluatorModal] = useState(false);\n  const [showManualCorrectionModal, setShowManualCorrectionModal] = useState(false);"
)

with open('src/pages/TabulasiPenilaian.tsx', 'w') as f:
    f.write(text)

