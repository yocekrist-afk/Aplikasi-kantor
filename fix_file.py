import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip() == ");" and lines[i+1].strip() == "}" and lines[i+2].strip() == "{activeTab === 'tampilan' && (":
        new_lines.append("              </div>\n")
        new_lines.append("            </div>\n")
        new_lines.append("          )}\n")
        # skip the next line which is "}"
        lines[i+1] = ""
    elif line.strip() == "}" and lines[i-1].strip() == ");" and lines[i+1].strip() == "{activeTab === 'tampilan' && (":
        pass # already skipped above
    else:
        new_lines.append(line)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.writelines(new_lines)
