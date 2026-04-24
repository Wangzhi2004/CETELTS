#!/usr/bin/env python3
"""Prepare CET-6 PDF manifests into a normalized file registry.

This script does not parse PDFs yet. It validates file naming, builds a manifest,
and prepares folder layout for later extraction.
"""
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

NAME_RE = re.compile(r"^(?P<year>20\d{2})-(?P<month>06|12)-set(?P<set_no>\d+)-(?P<kind>paper|expl)\.pdf$")


@dataclass
class PdfRecord:
    file_name: str
    file_path: str
    doc_type: str
    year: int
    month: int
    set_no: int


def parse_name(path: Path) -> Optional[PdfRecord]:
    m = NAME_RE.match(path.name)
    if not m:
        return None
    kind = m.group("kind")
    return PdfRecord(
        file_name=path.name,
        file_path=str(path.resolve()),
        doc_type="paper_pdf" if kind == "paper" else "explanation_pdf",
        year=int(m.group("year")),
        month=int(m.group("month")),
        set_no=int(m.group("set_no")),
    )


def scan_dir(root: Path) -> list[PdfRecord]:
    records: list[PdfRecord] = []
    for path in sorted(root.rglob("*.pdf")):
        rec = parse_name(path)
        if rec:
            records.append(rec)
    return records


def write_manifest(records: list[PdfRecord], out_csv: Path) -> None:
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["doc_type", "file_name", "file_path", "year", "month", "set_no", "pages", "notes"],
        )
        writer.writeheader()
        for rec in records:
            row = asdict(rec)
            row["pages"] = ""
            row["notes"] = ""
            writer.writerow(row)


def write_index(records: list[PdfRecord], out_json: Path) -> None:
    papers: dict[tuple[int, int, int], dict] = {}
    for rec in records:
        key = (rec.year, rec.month, rec.set_no)
        papers.setdefault(
            key,
            {
                "exam_type": "cet6",
                "year": rec.year,
                "month": rec.month,
                "set_no": rec.set_no,
                "source_documents": {},
            },
        )
        papers[key]["source_documents"][rec.doc_type] = rec.file_name

    out_json.write_text(json.dumps(list(papers.values()), ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("input_dir", help="Directory containing raw PDFs")
    parser.add_argument("--out_dir", default=".", help="Output directory")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    records = scan_dir(input_dir)
    write_manifest(records, out_dir / "pdf_manifest.generated.csv")
    write_index(records, out_dir / "paper_index.generated.json")
    print(f"[OK] indexed {len(records)} pdf files")


if __name__ == "__main__":
    main()
