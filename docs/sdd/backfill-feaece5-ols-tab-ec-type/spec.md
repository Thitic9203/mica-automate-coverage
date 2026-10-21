# Spec — backfill for commit feaece5 (OLS tab: Exceptional Case from ticket EC items)

> **Written after the code (2026-10-21).** Commit `feaece5` landed on `main` citing
> `Spec: ols-progress-export R6h` — a spec that lives in the test repo, not here. This repo had no
> `docs/sdd/` folder for the change. This folder describes what the commit does; it does not claim the
> code followed it. Found by the SDD audit of 2026-10-21. History is not rewritten.

## Rules

- **R1** — เมื่อแท็บ OLS แสดงการ์ด "Cases by type" ข้อความใต้การ์ดต้องบอกว่า type มาจาก Qase "Test Case Type"
  และ **Exceptional = เคสที่ทดสอบ EC item ของ ticket** มิฉะนั้นใช้ Qase หรือกฎ keyword ที่ตกลงไว้.
  Source: export rule R6h in the test repo's `ols-progress-export` spec (EC-item cases are Exceptional Case);
  this repo's `docs/sdd/ols-tab` R11/R14 (type card, every case has a type).
- **R2** — `public/ols-progress.json` ต้องเป็นไฟล์ที่ export สร้าง (ตัวเลขใหม่หลังกฎ R6h) ห้ามแก้ตัวเลขด้วยมือ.
  Source: `docs/sdd/ols-tab` "Source of every number".

## Out of scope

- How the export decides an EC item (owned by the export spec in the test repo).

## Done when

- `public/index.html` card note reads as in R1 and `public/ols-progress.json` is an export output (feaece5).
