# ETL AI Automation – n8n Student Data Pipeline

**Social Eagle – Gen AI Architect Program | Week 3 · Day 3 Assignment**
Author: Remya

An n8n workflow that **extracts** a messy student enrollment CSV, **transforms** it (cleaning, AI-assisted standardisation, de-duplication), **filters** it by a business rule, and **loads** the result into clean CSV files, including a separate file for Chennai students with valid email addresses.

---

## Pipeline at a glance

```
students.csv          54 rows in
  trimmed, Title-Cased names, lowercased + validated emails, AI-standardised courses
  4 duplicates removed            (duplicate = same email)
  17 rows filtered out            (Fee_Paid != Yes)
students_clean.csv    33 rows out
  ├─ students_chennai_valid_email.csv   9 rows   (City = Chennai AND Email valid)
  └─ students_others.csv               24 rows   (everyone else)
```

---

## Workflow

![Workflow canvas](screenshots/workflow_canvas.png)

```
Upload Student CSV (Form) → Extract from File → Basic LLM Chain (+ OpenAI Chat Model)
   → Loop Over Items ──loop──→ Code in JavaScript ──→ back to Loop
                     └─done──→ Remove Duplicates → Filter (Fee Paid = Yes)
                                   ├→ Convert to CSV → students_clean.csv
                                   └→ If (City = Chennai AND Email Valid)
                                         ├ true  → Convert to CSV → students_chennai_valid_email.csv
                                         └ false → Convert to CSV → students_others.csv
```

| # | Node | Stage | What it does |
|---|------|-------|--------------|
| 1 | Upload Student CSV (Form Trigger) | Extract | Uploads the raw CSV in one click |
| 2 | Extract from File | Extract | Turns CSV rows into n8n items (header row on) → 54 items |
| 3 | Basic LLM Chain + OpenAI Chat Model (gpt-4o-mini) | Transform (AI) | Returns a Title Case name and a standard course name (Python / Machine Learning / Data Science) per row |
| 4 | Loop Over Items (batch size 1) | Transform | Processes students one at a time; `loop` → Code, `done` → next stage |
| 5 | Code in JavaScript | Transform | Rule-based cleaning of every field (see below) |
| 6 | Remove Duplicates | Transform | Drops repeats on `Email` → 50 items |
| 7 | Filter – Fee Paid | Filter | Keeps `Fee_Paid = Yes` → 33 items |
| 8 | If – Chennai & Valid Email | Load | Splits into Chennai/valid-email vs others |
| 9 | Convert to File (×3) | Load | Writes the three clean CSV files |

---

## Problems deliberately present in the input

| Problem | Example |
|---|---|
| Inconsistent capitalisation | `manoj k`, `PRIYA S`, `RAJESH KK` |
| Leading / trailing spaces | `" anitha r "`, `"ANITHA@GMAIL.COM "`, `" chennai "` |
| Invalid emails | `manojk@gmail`, `ravikumar@`, `karthik123` |
| Course name variants | `ML`, `ml`, `machine learning`, `PYTHON`, `DATA SCIENCE` |
| Fee flag variants | `yes`, `Yes`, `YES`, `no`, `NO` |
| Missing / short phone numbers | blank, `98765` |
| Missing city | blank |
| Non-ISO dates | `23-05-2025` (dd-mm-yyyy) |
| Duplicate students | STU1004, STU1011, STU1024, STU1036 appear twice with different case/spacing |

---

## Cleaning rules (Code node)

| Field | Rule |
|---|---|
| Student_ID | Trimmed, upper case |
| Name | Trimmed, extra spaces removed, Title Case (initials stay capital: `Rajesh KK`) |
| Email | Trimmed, lower case |
| Email_Status *(new column)* | `Valid` if it matches `name@domain.tld`, else `Invalid` |
| Phone | Digits only; kept only if exactly 10 digits, otherwise blank |
| Course | AI answer used only if it is one of the 3 allowed values; otherwise a fallback map (`ml` → Machine Learning, etc.) |
| Fee_Paid | Standardised to `Yes` / `No` |
| City | Title Case; blank → `Not Provided` |
| Enrolled_Date | `dd-mm-yyyy` → `yyyy-mm-dd` |

---

## Design decisions

- **What counts as a duplicate?** Same email address (after trimming and lowercasing). The first occurrence is kept.
- **Rows with a missing or invalid email?** Kept, not dropped. They are flagged `Email_Status = Invalid` and routed to `students_others.csv` for review.
- **Filter rule:** only students with `Fee_Paid = Yes` go to the clean output.
- **If rule:** `City = Chennai` **AND** `Email_Status = Valid` → separate Chennai file.
- **Why AI + code together?** The LLM handles fuzzy text (course aliases, names); the Code node validates its answer and falls back to fixed rules, so the output is correct even if the AI call fails.
- **Why a Form upload instead of Read/Write Files from Disk?** The hosted n8n server does not allow disk access, so the CSV is uploaded through a Form Trigger and outputs are exported with Convert to File. The Extract → Transform → Filter → Load flow is unchanged.

---

## Before and after

![Before and after CSVs](screenshots/before_after.png)

| | Before (raw) | After (clean) |
|---|---|---|
| Name | `  anitha r ` | `Anitha R` |
| Email | `ANITHA@GMAIL.COM ` | `anitha@gmail.com` |
| Course | `ml` | `Machine Learning` |
| Fee_Paid | `YES` | `Yes` |
| City | `CHENNAI` | `Chennai` |
| Enrolled_Date | `23-05-2025` | `2025-05-23` |

---

## Repository contents

| File | Description |
|---|---|
| `ETL_AI_Automation.json` | n8n workflow export (import via **Workflows → Import from File**) |
| `students.csv` | Messy input – 54 rows |
| `students_clean.csv` | Cleaned, de-duplicated, fee-paid students – 33 rows |
| `students_chennai_valid_email.csv` | Chennai students with valid emails – 9 rows |
| `students_others.csv` | All other fee-paid students – 24 rows |
| `screenshots/` | Workflow canvas and before/after screenshots |

---

## How to run

1. Import `ETL_AI_Automation.json` into n8n.
2. Open **OpenAI Chat Model** and select your OpenAI credential.
3. Click **Execute workflow**, upload `students.csv` in the form, and submit.
4. When every node is green, download the three CSVs from the **Binary** tab of each *Convert to CSV* node.

> The OpenAI API key is not included in the workflow file; n8n stores only a reference to the credential.

---

## Run video

Screen recording of one full run: *(link to community post)*
