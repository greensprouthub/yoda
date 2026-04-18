# Puzzle4Life — Production Pipeline Spec
**Version:** 1.0 — 2026-04-15

## Pipeline Stages

### Stage 1 — AUDIT
- Load piece data from master CSV
- Check every field is present and non-empty
- Validate: title ≤ 40 chars, subtitle ≤ 55 chars, activities 3–7 items
- Validate: theme_color is valid hex, piece_number is unique, set_name is one of known sets
- Flag logical issues: duplicate titles, missing illustration_prompt, star/heart pieces with >3 activities
- Output: audit_report.json with PASS/FAIL/WARN per piece

### Stage 2 — ILLUSTRATION GENERATION
- For each piece: generate monochrome line-art illustration via AI
- Save to: /app/puzzle4life/{set_folder}/pieces/illustrations/piece_{N}_{short_name}_illustration.png
- Log illustration_cdn_url to CSV

### Stage 3 — FRONT FACE COMPOSITOR (3 versions)
- V1: basswood base + engraved border + title + subtitle + illustration (mono) + set_name + piece_number
- V2: basswood base + engraved border + title + subtitle + COLORED illustration + set_name + piece_number
- V3: solid theme_color base + white border + white title + white subtitle + watercolor/flat illustration + set_name + piece_number
- Save: piece_{N}_{short_name}_front_v1.png / _v2.png / _v3.png

### Stage 4 — BACK FACE COMPOSITOR (3 versions)
- V1: basswood + ✓ title + divider + □ checklist items + ⭐ + ❤️ + set_name + #N (all engraved mono)
- V2: basswood + colored title + colored checkboxes + colored benefits (UV printed style)
- V3: solid theme_color + white title + white checklist + white benefits

### Stage 5 — CSV UPDATE
- Write all paths and CDN URLs back to master_pieces.csv
- Fields updated: illustration_cdn_url, v1_front_cdn, v2_front_cdn, v3_front_cdn, v1_back_cdn, v2_back_cdn, v3_back_cdn, render_params (JSON blob for exact reproduction)

### Stage 6 — ENTITY UPDATE
- Update Puzzle4LifePiece entity record for each piece

### Stage 7 — GIT COMMIT
- Commit all generated files
- Commit message: "Piece batch render — pieces {N}-{N}: {set_name}, 3 versions front+back"

## Master CSV — Extended Column Set

piece_number, short_name, title, subtitle, icon, category, theme_color, set_name, set_folder,
piece_type, activity_1..7, star_benefit, heart_benefit,
source_type, source_name, source_link, source_date,
illustration_prompt, illustration_style, bg_style_v3,
v1_laser_path, v2_uv_path, v3_color_path,
v1_cdn_url, v2_cdn_url, v3_cdn_url,
v1_front_cdn, v2_front_cdn, v3_front_cdn,
v1_back_cdn, v2_back_cdn, v3_back_cdn,
illustration_cdn_url, render_params_json,
audit_status, audit_notes,
base44_files_uploaded, git_committed, status, review_notes
