# Puzzle4Life Set Production Standard

## Rule
Every time a new Puzzle4Life puzzle set is generated, follow this EXACT workflow without deviation.

---

## YOUTUBE LINK = FULL PIPELINE. NO EXCEPTIONS.

When Baris drops ANY YouTube link in chat:

1. **Immediately scrape** the video title + transcript (via deciphr.ai, web search, or direct read)
2. **Extract all insights** → save GshIntel records (batch_number = next available, score 1-5)
3. **Generate Puzzle4Life piece concepts** — every actionable habit, framework, mindset shift, checklist becomes a piece
4. **Assign next available piece numbers** (check DB for highest piece_number + 1)
5. **Generate all 3 image versions** for EACH piece (V1, V2, V3 front + back = 5 images per piece)
6. **Upload each image to Google Drive** immediately after generation (descriptive filenames, correct subfolder)
7. **Save CDN URLs** to Puzzle4LifePiece entity records
8. **Append to master_pieces.csv**
9. **Push to GitHub** with descriptive commit message
10. **Report back** with piece numbers, titles, CDN URLs, Drive link, GitHub commit

DO NOT skip image generation. DO NOT just save data records. DO NOT ask for confirmation. JUST DO IT ALL.

---

## GOLD TEMPLATE — LOCKED 2026-04-15

**Front template:** `/app/puzzle4life/piece_template_gold.png`
**Back template:** `/app/puzzle4life/piece_template_back_gold.png`
**CDN Front:** `https://base44.app/api/apps/69d577e334f46ea2be6055ca/files/mp/public/69d577e334f46ea2be6055ca/0ed6561b1_piece_template_gold.png`
**CDN Back:** `https://base44.app/api/apps/69d577e334f46ea2be6055ca/files/mp/public/69d577e334f46ea2be6055ca/9cde6abdf_piece_template_back_gold.png`
**Physical reference photo:** `https://media.base44.com/images/public/69d577e334f46ea2be6055ca/9440ce1ae_Image12.jpg`
**Full spec:** `/app/puzzle4life/PIECE_TEMPLATE_SPEC.md`

**DO NOT change the outer hex shape.** It is locked. Any regeneration must use the physical reference photo + gold templates as reference images.

---

## HEX SHAPE SPEC (locked)

- Canvas: 1024 × 1024 px
- Flat-top hexagon, radius ~420px
- Each of 6 flat edges has ONE connector centered on midpoint
- Pattern: Edge 1 (top) = TAB, Edge 2 (top-right) = SLOT, alternating around
- Tabs = small rounded bump protruding outward
- Slots = same size notch cut inward
- Corners: clean sharp points — NO connectors on corners
- Reference: the physical wood photo shows the exact correct connector shape

---

## FRONT FACE — Layer Stack (top to bottom)

| Layer | Content | Position |
|---|---|---|
| 0 | Basswood wood grain hex shape | Full canvas |
| 1 | Thin engraved border line | ~20px inset from hex edge |
| 2 | **Title** — bold, 52px, dark brown | Top section, centered, y≈180px |
| 3 | **Subtitle** — regular, 32px, dark brown | Below title, y≈250px |
| 4 | **Illustration** — engraved line-art of product/icon | Center, y≈420–580px, ~300×300px |
| 5 | **Set name** (brand only, no "Growth Set" / "Action Set") | Lower left, x≈120 y≈820px, 24px |
| 6 | **Piece number** `#NN` | Lower right, x≈880 y≈820px, 24px |

---

## BACK FACE — Layer Stack

| Layer | Content | Position |
|---|---|---|
| 0 | Basswood wood grain hex shape (slightly lighter) | Full canvas |
| 1 | Thin engraved border line | ~20px inset |
| 2 | **Title** with checkmark prefix `✓` — bold, 40px | Top, y≈160px |
| 3 | Thin engraved horizontal divider line | Below title |
| 4 | **Checklist** — 3–7 items, each with `□` checkbox prefix, 28px | Center column, y≈240–700px |
| 5 | `⭐` star_benefit — small centered text | y≈760px |
| 6 | `❤️` heart_benefit — small centered text | y≈800px |
| 7 | **Set name** (brand only) | Lower left, 20px |
| 8 | **Piece number** `#NN` | Lower right, 20px |

---

## 3 VERSIONS — Always produced together

| Version | Filename | Treatment |
|---|---|---|
| V1 | `v1_laser_engraved_basswood.png` | Pure laser engraving. No color. Dark burned lines on natural basswood. |
| V2 | `v2_uv_icons_text_on_wood.png` | UV printed colored icons + text only. Wood grain background stays visible. |
| V3 | `v3_full_vibrant_color.png` | Full color: solid theme color hex background. See V3 color rules below. |

---

## V3 FULL COLOR — Special Rules (LOCKED)

- Hex background = solid theme color
- Title text = WHITE
- Subtitle text = light tint or white
- Checklist items = alternating WHITE and light yellow/cream for readability
- Illustration/icon = WHITE line art
- Emojis rendered in their **natural full color** (⭐ = gold, ❤️ = red, □ = white outline)
- ⭐ star_benefit line = gold/yellow emoji + white text
- ❤️ heart_benefit line = red/pink emoji + white text
- Checklist □ checkboxes = white outline boxes
- Set name + piece number = WHITE
- Do NOT use one flat color for everything — use natural emoji colors + white text contrast

---

## BOARD LAYOUT (full set visualization)

- 7 interlocking hexagons in honeycomb/flower pattern + ⭐ Star piece + ❤️ Heart piece
- Title lower left of board: `[SET NAME] / 1% Better for the Planet / Puzzle4Life™`
- Star piece: #F9A825 golden yellow · Heart piece: #E91E63 hot pink

---

## PIECE NUMBERING

- Global unique piece_number — never resets between sets
- Pieces 1–8: Lucky7 Growth Set
- Pieces 9–17: Food Waste Action Set
- Pieces 18–26: Wormspire Growth Set
- Pieces 27+: next sets (PieceTheAI / BizPeace.ai Growth Set etc.)
- Star and Heart pieces get their own unique numbers
- piece_type = "Core" / "Star" / "Heart"
- ALWAYS query DB for max piece_number before assigning new ones

---

## PER-PIECE DATA CONTRACT (required fields)

```json
{
  "piece_number": 18,
  "short_name": "start-your-tower",
  "title": "Start Your Tower",
  "subtitle": "Turn scraps into garden gold",
  "icon": "🪱",
  "illustration_prompt": "vertical worm composting tower with lid, side spout, worms visible, minimal line art",
  "theme_color": "#2E7D32",
  "set_name": "Wormspire",
  "piece_type": "Core",
  "activities": ["...3 to 7 items..."],
  "star_benefit": "...",
  "heart_benefit": "..."
}
```

---

## FILE ORGANIZATION

```
/app/puzzle4life/{set_folder}/
  v1_laser_engraved_basswood.png     ← full board V1
  v2_uv_icons_text_on_wood.png       ← full board V2
  v3_full_vibrant_color.png          ← full board V3
  pieces/
    piece_{N}_{short_name}_front.png ← individual front
    piece_{N}_{short_name}_back.png  ← individual back
```

---

## GENERATION WORKFLOW (per piece)

1. Query DB for max piece_number → assign next number(s)
2. Generate all 5 images via AI image generation in parallel:
   - V1 front, V1 back, V2 front, V3 front, V3 back
3. Always pass physical reference photo + gold template as existing_image_urls
4. Save CDN URLs to Puzzle4LifePiece entity record
5. Upload to Google Drive with descriptive filenames immediately
6. Append to master CSV
7. Push to GitHub

---

## GOOGLE DRIVE AUTO-UPLOAD (MANDATORY)

Every piece image must be uploaded to Google Drive immediately after generation using descriptive filenames.

**Folder structure:**
```
Puzzle4Life/  (root: 1DO2uScE5ler9YGZpH4xtbM-2tiXBlETx)
  Lucky7 Growth Set — Pieces 01-08/     (1e0K3QVjvjmEr4rEKLFy-zsKf4YoclV36)
  Food Waste Action Set — Pieces 09-17/ (1S2Eo8hmD4-5tAKSL7kL9VXjVRFxJUDZW)
  Wormspire Growth Set — Pieces 18-26/  (1c2QCwZlUuiqGDUvchjzT-KONQ-UTxxJd)
  [New sets get their own subfolder — create it if it doesn't exist]
```

**Filename format (descriptive, NO cryptic hashes):**
```
Piece-{NN}_{Title-With-Dashes}_V1-Laser-Engraved.png
Piece-{NN}_{Title-With-Dashes}_V1-Laser-Back.png
Piece-{NN}_{Title-With-Dashes}_V2-UV-Print.png
Piece-{NN}_{Title-With-Dashes}_V3-Full-Color.png
Piece-{NN}_{Title-With-Dashes}_V3-Full-Color-Back.png
```

**Upload method:** Download from CDN URL → upload via Google Drive API using `$GOOGLEDRIVE_ACCESS_TOKEN`

**When to upload:** Immediately after each piece is generated — do not batch at the end.

**Token:** Use `get_connector_token("googledrive")` before uploading if token not already in env.

---

## POST-SET WORKFLOW

1. Upload all 3 board versions to CDN
2. Write all files into Base44 Files panel
3. Create/update Puzzle4LifeSet entity record
4. Create Puzzle4LifePiece entity records (one per piece)
5. Append all pieces to `/app/puzzle4life/csv/master_pieces.csv`
6. Upload all piece images to Google Drive (descriptive filenames, correct subfolder)
7. Push to GitHub with descriptive commit message
8. Provide CDN URLs + Google Drive folder link + GitHub commit hash in response

---

## COLOR PALETTE

| Version | Wood base | Engraved lines | Background |
|---|---|---|---|
| V1 laser | `#F5E6C8` | `#5C3D1E` | `#FFFFFF` |
| V2 UV | `#F5E6C8` (shows through) | `#5C3D1E` | `#FFFFFF` |
| V3 color | Theme color (solid fill) | `#FFFFFF` (white text/icons) | `#FFFFFF` |

Star piece color: `#F9A825` · Heart piece color: `#E91E63`
