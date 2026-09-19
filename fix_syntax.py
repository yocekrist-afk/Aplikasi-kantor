import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# Fix the premature closing
text = text.replace(
    "                </div>\n      </div>\n    </div>\n  );\n}\n          {activeTab === 'tampilan'",
    "                </div>\n              </div>\n            </div>\n          )}\n          {activeTab === 'tampilan'"
)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(text)

