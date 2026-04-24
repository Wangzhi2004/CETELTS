import Database from "better-sqlite3";
import pg from "pg";

const SQLITE_PATH = "./cet6_cloudflare_deploy_db/db/cet6_importable.sqlite";
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error("❌ 请设置 DATABASE_URL 环境变量（Neon 连接字符串）");
  console.error("   例如：");
  console.error('   $env:DATABASE_URL="postgresql://neondb_owner:xxxx@ep-xxx.neon.tech/neondb?sslmode=require"');
  console.error("   node scripts/migrate-sqlite-to-neon.mjs");
  process.exit(1);
}

async function main() {
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pool = new pg.Pool({ connectionString: PG_URL });

  console.log("✅ 连接成功！开始迁移...\n");

  const tables = [
    {
      name: "papers",
      columns: [
        "paper_id", "year", "month", "set_no", "original_pdf",
        "answer_pdf", "answer_docx", "answer_pair_status",
        "original_page_count", "answer_text_coverage", "notes",
        "writing_prompt", "translation_prompt",
      ],
    },
    {
      name: "answer_resources",
      columns: [
        "answer_id", "year", "month", "set_part", "answer_pdf",
        "answer_docx", "source_format", "text_coverage",
        "parsed_question_count", "answer_key_count", "linked_papers",
      ],
    },
    {
      name: "paper_answer_links",
      columns: ["paper_id", "answer_id", "link_type"],
    },
    {
      name: "question_shells",
      columns: [
        "paper_id", "question_no", "section_code", "question_type",
        "stem", "option_a", "option_b", "option_c", "option_d",
        "answer_key", "answer_status", "source_updated_from",
      ],
    },
    {
      name: "section_texts",
      columns: ["paper_id", "section_code", "source_type", "text"],
    },
    {
      name: "answer_question_details",
      columns: [
        "paper_id", "answer_id", "question_no", "answer_key",
        "source_type", "explanation_text", "raw_block",
        "provenance", "confidence", "review_status",
      ],
    },
    {
      name: "word_bank_items",
      columns: ["paper_id", "section_code", "letter", "word"],
    },
  ];

  for (const table of tables) {
    const rows = sqlite.prepare(`SELECT * FROM ${table.name}`).all();
    if (rows.length === 0) {
      console.log(`⏭️  ${table.name}: 0 行，跳过`);
      continue;
    }

    const cols = table.columns.join(", ");
    const placeholders = table.columns.map((_, i) => `$${i + 1}`).join(", ");
    const insertSql = `INSERT INTO ${table.name} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    let inserted = 0;
    for (const row of rows) {
      const values = table.columns.map((col) => {
        const val = row[col];
        if (val === undefined || val === null) return null;
        if (typeof val === "string" && val.length > 50000) return val.slice(0, 50000);
        return val;
      });

      try {
        const result = await pool.query(insertSql, values);
        if (result.rowCount && result.rowCount > 0) inserted++;
      } catch (err) {
        console.error(`  ⚠️  ${table.name} 插入失败: ${err.message.slice(0, 80)}`);
      }
    }

    console.log(`✅ ${table.name}: ${rows.length} 行读取，${inserted} 行插入`);
  }

  await pool.end();
  sqlite.close();
  console.log("\n🎉 迁移完成！");
}

main().catch((err) => {
  console.error("❌ 迁移失败:", err);
  process.exit(1);
});
