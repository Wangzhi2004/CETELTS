# 数据字典

## 1. source_documents

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 原始文档主键 |
| doc_type | text | 文档类型，paper_pdf / explanation_pdf 等 |
| file_name | text | 原始文件名 |
| file_path | text | 存储路径 |
| file_sha256 | text | 去重和校验用 |
| year | integer | 年份 |
| month | integer | 月份，六级一般为 6 / 12 |
| set_no | integer | 第几套 |
| pages | integer | 页数 |

## 2. exam_papers

一套完整试卷，是真题数据的顶层实体。

## 3. exam_sections

建议固定为：
- writing
- listening
- reading
- translation

## 4. passages

用于承载：
- 阅读篇章
- 听力材料对应说明块
- 题组说明

## 5. questions

建议一切训练都围绕 question 这个实体展开。question_no 在一套卷中必须唯一。

## 6. choices

仅用于客观题。主观题不应创建 choices。

## 7. answers

- 单选题：answer_type = single_choice, answer_value = A/B/C/D
- 写作题：answer_type = essay, answer_json 可以放范文与评分要点
- 翻译题：answer_type = translation, answer_json 可放参考译文

## 8. explanations

保留官方解析与后续 AI 增强解析并存。

## 9. skill_tags

建议预置标签：

### reading
- reading.locating
- reading.paraphrase
- reading.main_idea
- reading.attitude
- reading.syntax
- reading.distractor

### listening
- listening.number
- listening.transition
- listening.speaker_relation
- listening.map_route
- listening.paraphrase

### writing
- writing.task_response
- writing.outline
- writing.argument
- writing.cohesion
- writing.lexicon
- writing.grammar

### translation
- translation.core_meaning
- translation.expression
- translation.grammar

## 10. parsing_jobs / review_tasks

这两张表是后续半自动导入 PDF 必须的，不要省掉。
