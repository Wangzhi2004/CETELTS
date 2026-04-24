# CET6 Importable SQLite Database

这是给本地工程与 Cloudflare 部署测试准备的六级真题数据库包。

## 文件

- `db/cet6_importable.sqlite`：主 SQLite 数据库
- `docs/schema.sql`：数据库结构
- `docs/summary_final.json`：结构化整理摘要，如存在
- `docs/ENHANCEMENT_REPORT.md`：增强报告，如存在
- `docs/unanswered_questions.csv`：未完全补齐题目清单，如存在

## 基本信息

Source database: `/mnt/data/cet6_importable_package_final_v3/db/cet6_importable.sqlite`
SHA256: `13bca67f31608040a8f44ea16db22d53d963d9c7d4c7c8d1ed4b6659970ccd49`

## 表统计

```json
{
  "answer_question_details": 731,
  "answer_resources": 19,
  "paper_answer_links": 19,
  "papers": 18,
  "question_shells": 990,
  "section_texts": 62,
  "sqlite_sequence": 4,
  "word_bank_items": 45
}
```

## 题目答案覆盖

```json
{
  "total_questions": 990,
  "answered_questions": 692,
  "answer_coverage_pct": 69.9
}
```

## Cloudflare D1 导入提示

Cloudflare D1 是 SQLite-compatible。通常不要直接上传 `.sqlite` 文件，而是先导出 SQL dump：

```bash
sqlite3 db/cet6_importable.sqlite .dump > cet6_importable_dump.sql
wrangler d1 execute <DB_NAME> --file=./cet6_importable_dump.sql
```

如果你本地 Next.js / Prisma 先跑 SQLite，可以直接把 datasource 指向：

```env
DATABASE_URL="file:./db/cet6_importable.sqlite"
```
