import re

with open('src/pages/participant/TestEngine.tsx', 'r') as f:
    text = f.read()

# Add state
text = text.replace(
    "const [tabSwitchActive, setTabSwitchActive] = useState(!disableAntiCheat);",
    "const [tabSwitchActive, setTabSwitchActive] = useState(!disableAntiCheat);\n  const [isRandomizeChoices, setIsRandomizeChoices] = useState(true);"
)

# Load state from settings
text = text.replace(
    "if (config.tabSwitchDetect !== undefined) {\n            setTabSwitchActive(config.tabSwitchDetect);\n          } else if (config.requireAntiCheat !== undefined) {\n            setTabSwitchActive(config.requireAntiCheat); // legacy fallback\n          }",
    "if (config.tabSwitchDetect !== undefined) {\n            setTabSwitchActive(config.tabSwitchDetect);\n          } else if (config.requireAntiCheat !== undefined) {\n            setTabSwitchActive(config.requireAntiCheat); // legacy fallback\n          }\n          if (config.randomizeChoices !== undefined) {\n            setIsRandomizeChoices(config.randomizeChoices);\n          }"
)

# Apply to shuffle logic
text = text.replace(
    "const originalIndex = optionShuffleMap[qIndex] ? optionShuffleMap[qIndex][displayIndex] : displayIndex;",
    "const originalIndex = (isRandomizeChoices && optionShuffleMap[qIndex]) ? optionShuffleMap[qIndex][displayIndex] : displayIndex;"
)

with open('src/pages/participant/TestEngine.tsx', 'w') as f:
    f.write(text)

