import re

with open('src/pages/participant/Subtest9Flow.tsx', 'r') as f:
    text = f.read()

# Add states
text = text.replace(
    "const [antiCaptureActive, setAntiCaptureActive] = useState(!disableAntiCheat);",
    "const [antiCaptureActive, setAntiCaptureActive] = useState(!disableAntiCheat);\n  const [isRandomizeChoices, setIsRandomizeChoices] = useState(true);\n  const [optionShuffleMap, setOptionShuffleMap] = useState<Record<number, number[]>>({});"
)

# Load config
text = text.replace(
    "if (config.tabSwitchDetect !== undefined) {\n            setTabSwitchActive(config.tabSwitchDetect);\n          } else if (config.requireAntiCheat !== undefined) {\n            setTabSwitchActive(config.requireAntiCheat); // legacy fallback\n          }",
    "if (config.tabSwitchDetect !== undefined) {\n            setTabSwitchActive(config.tabSwitchDetect);\n          } else if (config.requireAntiCheat !== undefined) {\n            setTabSwitchActive(config.requireAntiCheat); // legacy fallback\n          }\n          if (config.randomizeChoices !== undefined) {\n            setIsRandomizeChoices(config.randomizeChoices);\n          }"
)

# Pre-compute shuffle on mount (using totalQuestion 20 which is standard for subtest 9)
use_effect = """  // Shuffle map generation
  useEffect(() => {
    const shuffleMap: Record<number, number[]> = {};
    for (let i = 0; i < 20; i++) {
        const indices = [0, 1, 2, 3, 4];
        let seed = (participantId ? participantId.length : 0) + i * 7; 
        for (let j = 4; j > 0; j--) {
            seed = (seed * 9301 + 49297) % 233280;
            const rand = seed / 233280;
            const k = Math.floor(rand * (j + 1));
            [indices[j], indices[k]] = [indices[k], indices[j]];
        }
        shuffleMap[i] = indices;
    }
    setOptionShuffleMap(shuffleMap);
  }, [participantId]);

  useEffect(() => {"""
text = text.replace("useEffect(() => {\n    if (testPhase !== 'tes') return;", use_effect + "\n    if (testPhase !== 'tes') return;")

# Apply to render loop
replace_opt = """                {/* Option Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                  {SUBTEST9_OPTIONS.map((displayOpt, displayIndex) => {
                    const originalIndex = (isRandomizeChoices && optionShuffleMap[qIndex]) ? optionShuffleMap[qIndex][displayIndex] : displayIndex;
                    const opt = SUBTEST9_OPTIONS[originalIndex];
                    const isSelected = selectedOpt === opt.key;"""

text = re.sub(
    r'\{/\* Option Choices \*/\}\s*<div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">\s*\{SUBTEST9_OPTIONS.map\(opt => \{\s*const isSelected = selectedOpt === opt.key;',
    replace_opt,
    text
)

# Apply to example 1 & 2 - Example shouldn't be shuffled to avoid confusing explanation

with open('src/pages/participant/Subtest9Flow.tsx', 'w') as f:
    f.write(text)

