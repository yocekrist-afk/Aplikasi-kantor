import re

with open('src/utils/istAnswerKeys.ts', 'r') as f:
    text = f.read()

def replacer(match):
    prefix = match.group(1) # e.g. se
    code = prefix.upper()
    return f"""    let finalScore = isCorrect ? 1 : 0;
    if (overrides && overrides['{code}'] && overrides['{code}'][k.no] !== undefined) {{
      finalScore = overrides['{code}'][k.no];
    }}
    {prefix}Rw += finalScore;
    return {{
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,"""

text = re.sub(
    r'    if \(isCorrect\) ([a-z]{2})Rw\+\+;\n    return \{\n      no: k\.no,\n      userAnswer: u \?\? \'-\',\n      isCorrect,\n      score: isCorrect \? 1 : 0,',
    replacer,
    text
)

def ge_replacer(match):
    return """    let finalScore = isCorrect ? scoreVal : 0;
    if (overrides && overrides['GE'] && overrides['GE'][k.no] !== undefined) {
      finalScore = overrides['GE'][k.no];
    }
    geRw += finalScore;
    return {
      no: k.no,
      userAnswer: u ?? '-',
      isCorrect: finalScore > 0,
      score: finalScore,"""

text = re.sub(
    r'    const finalScore = isCorrect \? scoreVal : 0;\n    geRw \+= finalScore;\n    return \{\n      no: k\.no,\n      userAnswer: u \?\? \'-\',\n      isCorrect,\n      score: finalScore,',
    ge_replacer,
    text
)

with open('src/utils/istAnswerKeys.ts', 'w') as f:
    f.write(text)

