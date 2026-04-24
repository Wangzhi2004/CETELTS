import re

with open('d:/CETELTS/src/features/score-center/score-center-view.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix conditionals missing ?
content = re.sub(r'(scoreCenter\.pageStatus === "replanned")\s*\(', r'\1 ? (', content)
content = re.sub(r'(latestTeacherMessage)\s*\(', r'\1 ? (', content)
content = re.sub(r'(firstCard)\s*\(', r'\1 ? (', content)
content = re.sub(r'(mobile)\s*\(', r'\1 ? (', content)
content = re.sub(r'(compact)\s*\(', r'\1 ? (', content)
content = re.sub(r'(card\.isNew)\s*\(', r'\1 ? (', content)
content = re.sub(r'(compact)\s*"p-4" : "p-5"', r'\1 ? "p-4" : "p-5"', content)
content = re.sub(r'(isTeacher)\s*message\.kind : "user"', r'\1 ? message.kind : "user"', content)
content = re.sub(r'(isTeacher)\s*"text-\[#8590a6\]"', r'\1 ? "text-[#8590a6]"', content)
content = re.sub(r'(max === min)\s*1 :', r'\1 ? 1 :', content)
content = re.sub(r'isTeacher\s+"bg-\[linear', r'isTeacher\n            ? "bg-[linear', content)
content = re.sub(r'(weakestSkills\[0\])\s+"绛夊', r'\1 ?? "等待更多数据', content)

# Fix missing optional chaining ?
content = re.sub(r'scoreCenter\.teacherMessages', r'scoreCenter?.teacherMessages', content)
content = content.replace('setScoreCenter((prev: ScoreCenterState | null) => prev ({...prev, pageStatus: "replanning"}) : null);', 'setScoreCenter((prev: ScoreCenterState | null) => prev ? ({...prev, pageStatus: "replanning"}) : null);')
content = content.replace('setScoreCenter((prev: ScoreCenterState | null) => prev ({...prev, pageStatus: "ready"}) : null);', 'setScoreCenter((prev: ScoreCenterState | null) => prev ? ({...prev, pageStatus: "ready"}) : null);')
content = content.replace('scoreCenter?.teacherMessages ?', 'scoreCenter?.teacherMessages ?') # Just ensuring it's correct

with open('d:/CETELTS/src/features/score-center/score-center-view.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
