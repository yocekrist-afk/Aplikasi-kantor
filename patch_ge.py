import re

with open('src/utils/istAnswerKeys.ts', 'r') as f:
    text = f.read()

replacement = """    let score = scoreGeItem(idx, u);
    if (overrides && overrides['GE'] && overrides['GE'][k.no] !== undefined) {
      score = overrides['GE'][k.no];
    }
    geTotalPoints += score;"""

text = re.sub(
    r'    const score = scoreGeItem\(idx, u\);\n    geTotalPoints \+= score;',
    replacement,
    text
)

with open('src/utils/istAnswerKeys.ts', 'w') as f:
    f.write(text)

