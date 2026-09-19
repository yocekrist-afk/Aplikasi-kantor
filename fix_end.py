import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# Fix the broken component ending at line 587-590
text = text.replace(
    "                </div>\n      </div>\n    </div>\n  );\n}\n          {activeTab === 'tampilan'",
    "                </div>\n              </div>\n            </div>\n          )}\n          {activeTab === 'tampilan'"
)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(text)

