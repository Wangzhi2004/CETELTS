import re
with open('d:/CETELTS/src/features/score-center/score-center-view.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

content = re.sub(r'\?', '', content)
content = re.sub(r'', '', content)

with open('d:/CETELTS/src/features/score-center/score-center-view.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
