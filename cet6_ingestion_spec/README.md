# CET-6 真题与解析 PDF 入库规范与导入脚手架

这套规范用于把近十年六级真题 PDF 和解析 PDF 整理成可入库、可搜索、可训练、可回流分析的数据资产。

当前目标不是直接做 OCR 的最终生产管线，而是先统一：
1. 文件命名与目录结构
2. 数据库主表设计
3. 中间结构化 JSON 规范
4. 人工校对与发布流程
5. 导入脚手架与样例数据

## 推荐目录结构

```text
cet6-data/
  raw/
    papers/
      2016-06-set1-paper.pdf
      2016-06-set2-paper.pdf
    explanations/
      2016-06-set1-expl.pdf
      2016-06-set2-expl.pdf
  staging/
    manifests/
    extracted/
    reviewed/
  published/
    json/
    sql/
```

## 文件命名规范

- 真题 PDF: `{year}-{month}-set{n}-paper.pdf`
- 解析 PDF: `{year}-{month}-set{n}-expl.pdf`
- 提取中间文件: `{year}-{month}-set{n}.raw.json`
- 人工校对后文件: `{year}-{month}-set{n}.reviewed.json`
- 最终发布文件: `{year}-{month}-set{n}.published.json`

示例:
- `2021-12-set1-paper.pdf`
- `2021-12-set1-expl.pdf`

## 入库流程

1. 放入 raw/papers 与 raw/explanations
2. 在 `pdf_manifest.csv` 中登记文件元信息
3. 运行提取器或手工整理，生成 `staging/extracted/*.raw.json`
4. 人工校对题号、选项、答案、解析映射
5. 输出 `staging/reviewed/*.reviewed.json`
6. 通过校验器后导入数据库
7. 生成 `published/json/*.published.json`

## 推荐数据库实体

- source_documents: 原始 PDF 文件登记
- exam_papers: 某年某月某套卷
- exam_sections: 写作/听力/阅读/翻译等大模块
- passages: 篇章或题组材料
- questions: 题目
- choices: 选项
- answers: 标准答案
- explanations: 解析
- skill_tags: 技能标签
- question_skill_tags: 题目与技能标签映射
- parsing_jobs: 解析任务
- review_tasks: 人工校对任务

## 真题数据组织原则

- 以“试卷”为顶层单位，不以 PDF 文件为顶层单位
- 题目与解析必须分开存储，再通过 question_id 映射
- 一切训练逻辑以后都围绕 question / passage / skill_tag 运行
- 原始 PDF 永远保留，不直接作为训练读取对象

## 当前提供的文件

- `schema.sql`: PostgreSQL 版数据库建表规范
- `data_dictionary.md`: 字段字典
- `pdf_manifest_template.csv`: 原始 PDF 登记模板
- `paper_json_schema.md`: 单套试卷结构化 JSON 规范
- `sample_paper.reviewed.json`: 单套试卷样例
- `prepare_dataset.py`: 整理脚手架

## 下一步

把 PDF 上传后，我可以继续做这两步：
1. 帮你按命名规则和 manifest 先整理原始文件
2. 帮你把每套卷拆成结构化 JSON 并对齐到数据库规范
