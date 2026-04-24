# 单套试卷结构化 JSON 规范

每套卷整理成一个 JSON 文件，作为数据库导入前的中间标准格式。

## 顶层结构

```json
{
  "exam_type": "cet6",
  "year": 2021,
  "month": 12,
  "set_no": 1,
  "title": "CET-6 2021-12 Set 1",
  "source_documents": {
    "paper_pdf": "2021-12-set1-paper.pdf",
    "explanation_pdf": "2021-12-set1-expl.pdf"
  },
  "sections": [],
  "passages": [],
  "questions": []
}
```

## question 对象规范

```json
{
  "question_no": 16,
  "section_type": "reading",
  "question_type": "reading_mcq",
  "passage_ref": "reading-passage-2",
  "stem": "What does the author imply about ...?",
  "choices": [
    {"choice_key": "A", "choice_text": "..."},
    {"choice_key": "B", "choice_text": "..."},
    {"choice_key": "C", "choice_text": "..."},
    {"choice_key": "D", "choice_text": "..."}
  ],
  "answer": {
    "answer_type": "single_choice",
    "answer_value": "C"
  },
  "explanation": {
    "source_type": "official_pdf",
    "explanation_text": "...",
    "evidence_span": "paragraph 3"
  },
  "skill_tags": [
    {"tag_code": "reading.locating", "weight": 0.7},
    {"tag_code": "reading.paraphrase", "weight": 0.3}
  ],
  "source_page": 14
}
```

## 约束

- `question_no` 在同一套卷内唯一
- 所有选择题必须有 4 个 choices，除非原卷不是 4 选项题
- `answer` 必须与 question 一一对应
- `explanation` 允许暂时为空，但 reviewed/published 阶段必须补齐
- `passage_ref` 用于把题目与篇章挂接
