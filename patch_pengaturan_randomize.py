import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# Add state
text = text.replace(
    "const [tabSwitchDetect, setTabSwitchDetect] = useState(true);",
    "const [tabSwitchDetect, setTabSwitchDetect] = useState(true);\n  const [randomizeChoices, setRandomizeChoices] = useState(true);"
)

# Load setting
text = text.replace(
    "if (config.tabSwitchDetect !== undefined) setTabSwitchDetect(config.tabSwitchDetect);",
    "if (config.tabSwitchDetect !== undefined) setTabSwitchDetect(config.tabSwitchDetect);\n      if (config.randomizeChoices !== undefined) setRandomizeChoices(config.randomizeChoices);"
)

# Save setting
text = text.replace(
    "tabSwitchDetect \n      };",
    "tabSwitchDetect,\n        randomizeChoices\n      };"
)
text = text.replace(
    "tabSwitchDetect \r\n      };",
    "tabSwitchDetect,\n        randomizeChoices\n      };"
)
# Make sure we got the saving part right. Let's check the exact string
text = re.sub(r'tabSwitchDetect\s*\};', 'tabSwitchDetect,\n        randomizeChoices\n      };', text)

# Add UI
ui_part = """                  <label className="flex items-center cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={randomizeChoices} onChange={(e) => setRandomizeChoices(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${randomizeChoices ? 'bg-[#8BC34A]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${randomizeChoices ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800 text-sm">Acak Pilihan Jawaban</div>
                      <div className="text-xs text-gray-500">{randomizeChoices ? 'Aktif. Urutan pilihan jawaban (A, B, C, dst.) akan diacak untuk tiap peserta.' : 'Nonaktif. Urutan pilihan jawaban sesuai urutan aslinya.'}</div>
                    </div>
                  </label>
                </div>
              </div>"""

text = re.sub(
    r'</label>\s*</div>\s*</div>\s*<div className="flex justify-end pt-4">',
    '</label>\n' + ui_part + '\n\n              <div className="flex justify-end pt-4">',
    text
)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(text)

