# Puzzle4Life — Gold Piece Template Specification
**Locked:** 2026-04-15
**Template image:** `/app/puzzle4life/piece_template_gold.png`
**Canvas size:** 1024 × 1024 px

---

## FRONT FACE LAYERS (bottom to top)

| Layer | Name | Content | Position | Font / Style |
|---|---|---|---|---|
| 0 | `base_shape` | Hex puzzle piece silhouette with alternating tab/slot edges | Full canvas | Basswood warm wood grain fill |
| 1 | `border` | Thin engraved line just inside hex edge | ~20px inset from hex edge | Dark brown, 3px stroke |
| 2 | `title` | Piece title text | Top section, centered, y≈180px | Bold, 52px, dark brown engraved |
| 3 | `subtitle` | One-line subtitle/hook | Below title, centered, y≈250px | Regular, 32px, dark brown engraved |
| 4 | `illustration` | Central icon/product image, line-art engraved style | Center, y≈420–580px | Monochrome engraved line art, ~300×300px |
| 5 | `set_name` | Set name (no "Growth Set" / "Action Set" suffix) | Lower left, x≈120px y≈820px | Small, 24px, dark brown |
| 6 | `piece_number` | `#NN` piece number | Lower right, x≈880px y≈820px | Small, 24px, dark brown |

---

## BACK FACE LAYERS (bottom to top)

| Layer | Name | Content | Position | Font / Style |
|---|---|---|---|---|
| 0 | `base_shape` | Same hex silhouette, same tab/slot edges | Full canvas | Basswood wood grain (slightly lighter) |
| 1 | `border` | Thin engraved border line | ~20px inset | Dark brown, 3px stroke |
| 2 | `back_title` | "✓ Your Actions" or piece title | Top section, centered, y≈160px | Bold, 40px, dark brown |
| 3 | `checklist` | 3–7 micro-action checklist items | Center column, y≈240–700px | 28px, dark brown, each prefixed with engraved checkbox `□` |
| 4 | `star_benefit` | ⭐ save money line | Lower section, y≈760px, centered | 22px, dark brown |
| 5 | `heart_benefit` | ❤️ planet impact line | y≈800px, centered | 22px, dark brown |
| 6 | `set_name` | Set name | Lower left | 20px small |
| 7 | `piece_number` | `#NN` | Lower right | 20px small |

---

## SHAPE SPEC — Hex Puzzle Piece

```
Canvas:         1024 × 1024 px
Hex center:     512, 512
Hex radius:     420px (flat-to-flat ~730px)
Hex type:       Flat-top orientation
Corner style:   Clean sharp points
Tab/Slot size:  Width ~60px, Height ~35px, rounded rect (radius 12px)
Tab/Slot pos:   Centered on each flat edge midpoint
Pattern:        Edge 1 (top) = TAB, Edge 2 (top-right) = SLOT, alternating
```

---

## COLOR PALETTE — V1 Laser Engraved

| Element | Color |
|---|---|
| Wood base | `#F5E6C8` (warm pale basswood) |
| Engraved lines | `#5C3D1E` (dark walnut brown) |
| Border | `#7A4F2E` |
| Background (outside hex) | `#FFFFFF` |

## COLOR PALETTE — V2 UV Icons on Wood

| Element | Color |
|---|---|
| Wood base | `#F5E6C8` (same, wood shows through) |
| Icon fill | Theme color (per piece) |
| Text | `#5C3D1E` engraved |
| Background | `#FFFFFF` |

## COLOR PALETTE — V3 Full Vibrant

| Element | Color |
|---|---|
| Hex fill | Theme color (solid, per piece) |
| Icon | White `#FFFFFF` |
| Text | White `#FFFFFF` |
| Background (outside hex) | `#FFFFFF` |

---

## PIECE DATA CONTRACT (what must be provided per piece)

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
  "activities": [
    "Order or build your Wormspire vertical composting tower",
    "Set it up in a shaded spot — kitchen or patio works great",
    "Add bedding (shredded cardboard + coconut coir)",
    "Add your first batch of red wiggler worms",
    "Feed scraps every 2-3 days — small amounts to start",
    "Track your tower's progress weekly"
  ],
  "star_benefit": "Skip buying fertilizer — your tower makes it free",
  "heart_benefit": "Diverts food scraps from landfill from day one"
}
```

---

## GENERATION WORKFLOW (per piece)

1. **Generate illustration** via AI image gen (monochrome line art, transparent bg)
2. **Composite front face** — layer 0→6 programmatically using Pillow
3. **Composite back face** — layer 0→7 programmatically using Pillow
4. **Save** front + back PNGs to `/app/puzzle4life/{set_folder}/pieces/`
   - `piece_{number}_{short_name}_front.png`
   - `piece_{number}_{short_name}_back.png`
5. **Upload both to CDN**
6. **Update** Puzzle4LifePiece entity record with `png_individual_url`
7. **Append** to master CSV

---

## BACK DESIGN LAYOUT (checklist card)

```
┌─────────────────────────────────┐  ← hex shape with tabs/slots
│                                 │
│     ✓  Start Your Tower         │  ← title (bold, top)
│     ─────────────────           │  ← thin divider line
│                                 │
│  □  Set up tower in shade       │
│  □  Add cardboard bedding       │
│  □  Add red wiggler worms       │
│  □  Feed scraps every 2-3 days  │
│  □  Track weekly progress       │
│  □  Harvest castings at 60 days │
│                                 │
│  ⭐ Skip buying fertilizer       │
│  ❤️  Diverts scraps from landfill│
│                                 │
│  Wormspire              #18     │  ← lower corners
└─────────────────────────────────┘
```
