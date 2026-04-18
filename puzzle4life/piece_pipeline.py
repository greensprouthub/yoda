#!/usr/bin/env python3
"""
Puzzle4Life Piece Production Pipeline
======================================
Stage 1: AUDIT     — validate all piece data for logic, completeness, consistency
Stage 2: RENDER    — composite front + back, 3 versions each, using Pillow
Stage 3: CSV       — update master_pieces.csv with all paths, CDN URLs, render params
Stage 4: REPORT    — output audit_report.json + summary

Usage:
  python3 piece_pipeline.py --stage audit              # audit only
  python3 piece_pipeline.py --stage render --piece 18  # render one piece
  python3 piece_pipeline.py --stage render --set wormspire_growth_set
  python3 piece_pipeline.py --stage render --all       # render all pieces
  python3 piece_pipeline.py --stage full --all         # audit + render + CSV update
"""

import os, sys, json, csv, math, argparse, textwrap
from pathlib import Path
from datetime import datetime
from copy import deepcopy

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    PIL_OK = True
except ImportError:
    PIL_OK = False
    print("⚠️  Pillow not installed. Run: pip install Pillow")

# ─── PATHS ──────────────────────────────────────────────────────────────────
ROOT          = Path("/app/puzzle4life")
CSV_PATH      = ROOT / "csv" / "master_pieces.csv"
AUDIT_PATH    = ROOT / "csv" / "audit_report.json"
TEMPLATE_FRONT= ROOT / "piece_template_gold.png"
TEMPLATE_BACK = ROOT / "piece_template_back_gold.png"
FONTS_DIR     = Path("/usr/share/fonts/truetype")

# ─── COLORS ─────────────────────────────────────────────────────────────────
WOOD_BASE     = (245, 230, 200)       # #F5E6C8 basswood
WOOD_LIGHT    = (252, 242, 220)       # lighter back face
ENGRAVE_DARK  = (92, 61, 30)          # #5C3D1E dark brown
BORDER_BROWN  = (122, 79, 46)         # #7A4F2E
WHITE         = (255, 255, 255)
STAR_GOLD     = (249, 168, 37)        # #F9A825
HEART_PINK    = (233, 30, 99)         # #E91E63

# ─── HEX SHAPE ──────────────────────────────────────────────────────────────
CANVAS_SIZE   = 1024
HEX_CENTER    = (512, 512)
HEX_RADIUS    = 420          # flat-top
TAB_W         = 60           # tab/slot width
TAB_H         = 35           # tab/slot protrusion
TAB_R         = 12           # corner radius of tab

KNOWN_SETS = {
    "lucky7_growth_set":     "Lucky7",
    "food_waste_set":        "Food Waste",
    "wormspire_growth_set":  "Wormspire",
}

# ─── FONT LOADING ────────────────────────────────────────────────────────────
def load_font(size, bold=False):
    """Load best available font."""
    candidates_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    candidates_reg = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    candidates = candidates_bold if bold else candidates_reg
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()

# ─── HEX SHAPE GENERATOR ────────────────────────────────────────────────────
def hex_vertices(cx, cy, r):
    """6 vertices of flat-top hexagon."""
    verts = []
    for i in range(6):
        angle = math.radians(60 * i)  # flat-top: 0° = right
        verts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return verts

def draw_hex_with_connectors(draw, cx, cy, r, fill, outline, outline_width=4):
    """
    Draw hex with alternating tab/slot on each flat edge midpoint.
    Edge 0 (right) = TAB, Edge 1 (lower-right) = SLOT, alternating.
    Adjusted for flat-top: edges connect adjacent vertices.
    """
    verts = hex_vertices(cx, cy, r)
    # Build full polygon with tabs/slots
    poly = []
    for i in range(6):
        v1 = verts[i]
        v2 = verts[(i + 1) % 6]
        mid = ((v1[0]+v2[0])/2, (v1[1]+v2[1])/2)
        # Edge direction and normal
        dx = v2[0] - v1[0]
        dy = v2[1] - v1[1]
        length = math.sqrt(dx*dx + dy*dy)
        nx = -dy / length  # outward normal
        ny = dx / length
        # Half-tab width along edge
        tw = TAB_W / 2
        th = TAB_H

        # Add v1
        poly.append(v1)

        # Add connector at midpoint
        p1 = (mid[0] - tw*(dx/length), mid[1] - tw*(dy/length))
        p2 = (mid[0] + tw*(dx/length), mid[1] + tw*(dy/length))

        if i % 2 == 0:  # TAB — bump outward
            t1 = (p1[0] + nx*th, p1[1] + ny*th)
            t2 = (p2[0] + nx*th, p2[1] + ny*th)
            poly.extend([p1, t1, t2, p2])
        else:           # SLOT — cut inward
            s1 = (p1[0] - nx*th, p1[1] - ny*th)
            s2 = (p2[0] - nx*th, p2[1] - ny*th)
            poly.extend([p1, s1, s2, p2])

    draw.polygon(poly, fill=fill, outline=outline)
    if outline_width > 1:
        draw.line(poly + [poly[0]], fill=outline, width=outline_width)

def draw_inner_border(draw, cx, cy, r, inset=22, color=BORDER_BROWN, width=3):
    """Thin engraved border line just inside hex edge."""
    verts = hex_vertices(cx, cy, r - inset)
    poly = []
    for i in range(6):
        v1 = verts[i]
        v2 = verts[(i + 1) % 6]
        poly.append(v1)
    poly.append(poly[0])
    draw.line(poly, fill=color, width=width)

# ─── TEXT HELPERS ────────────────────────────────────────────────────────────
def draw_centered_text(draw, text, y, font, color, canvas_w=CANVAS_SIZE, max_width=None):
    """Draw horizontally centered text at given y."""
    if max_width:
        # Word wrap
        words = text.split()
        lines = []
        current = ""
        for word in words:
            test = (current + " " + word).strip()
            bb = draw.textbbox((0,0), test, font=font)
            if bb[2] - bb[0] <= max_width:
                current = test
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        for line in lines:
            bb = draw.textbbox((0,0), line, font=font)
            w = bb[2] - bb[0]
            draw.text(((canvas_w - w) // 2, y), line, font=font, fill=color)
            y += (bb[3] - bb[1]) + 8
        return y
    else:
        bb = draw.textbbox((0,0), text, font=font)
        w = bb[2] - bb[0]
        draw.text(((canvas_w - w) // 2, y), text, font=font, fill=color)
        return y + (bb[3] - bb[1])

def draw_text_at(draw, text, x, y, font, color, anchor="left"):
    bb = draw.textbbox((0,0), text, font=font)
    w = bb[2] - bb[0]
    if anchor == "right":
        x = x - w
    elif anchor == "center":
        x = x - w // 2
    draw.text((x, y), text, font=font, fill=color)

def hex_color(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

# ─── WOOD TEXTURE BASE ───────────────────────────────────────────────────────
def make_wood_base(size=CANVAS_SIZE, color=WOOD_BASE, lighter=False):
    """Create a simple wood-grain textured base image."""
    import random
    base_color = WOOD_LIGHT if lighter else color
    img = Image.new("RGB", (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Fill hex area with wood color
    draw_hex_with_connectors(draw, HEX_CENTER[0], HEX_CENTER[1], HEX_RADIUS,
                              fill=base_color, outline=ENGRAVE_DARK, outline_width=4)
    # Add subtle grain lines
    random.seed(42)
    grain_color = tuple(max(0, c - 15) for c in base_color)
    for _ in range(80):
        x = random.randint(50, size-50)
        y1 = random.randint(50, size-50)
        y2 = y1 + random.randint(80, 300)
        alpha = random.randint(1, 3)
        draw.line([(x, y1), (x + random.randint(-8,8), y2)],
                  fill=grain_color, width=alpha)
    return img

# ─── ILLUSTRATION PLACEHOLDER ────────────────────────────────────────────────
def make_illustration_placeholder(icon_text, size=280, color=ENGRAVE_DARK):
    """Placeholder illustration — large centered emoji/icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = load_font(180)
    bb = draw.textbbox((0,0), icon_text, font=font)
    w, h = bb[2]-bb[0], bb[3]-bb[1]
    draw.text(((size-w)//2, (size-h)//2 - 10), icon_text, font=font, fill=color)
    return img

# ─── FRONT FACE ──────────────────────────────────────────────────────────────
def render_front(piece, version="v1", illustration_img=None):
    """
    Render front face of a puzzle piece.
    version: "v1" (laser mono), "v2" (UV colored), "v3" (full color)
    """
    theme = hex_color(piece.get("theme_color", "#2E7D32"))
    is_star = piece.get("piece_type") == "Star"
    is_heart = piece.get("piece_type") == "Heart"
    if is_star:
        theme = hex_color("#F9A825")
    if is_heart:
        theme = hex_color("#E91E63")

    # ── Layer 0: Base ──
    if version == "v3":
        img = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), (255,255,255))
        draw = ImageDraw.Draw(img)
        draw_hex_with_connectors(draw, 512, 512, HEX_RADIUS,
                                  fill=theme, outline=WHITE, outline_width=4)
        text_color = WHITE
        border_color = tuple(max(0, c-40) for c in theme)
        subtitle_color = WHITE
    else:
        img = make_wood_base()
        draw = ImageDraw.Draw(img)
        text_color = ENGRAVE_DARK
        border_color = BORDER_BROWN
        subtitle_color = (110, 75, 40)

    # ── Layer 1: Border ──
    draw_inner_border(draw, 512, 512, HEX_RADIUS, inset=28, color=border_color, width=3)

    # ── Layer 2: Title ──
    font_title = load_font(52, bold=True)
    title = piece.get("title", "")
    y = 155
    y = draw_centered_text(draw, title, y, font_title, text_color, max_width=680)

    # ── Layer 3: Subtitle ──
    font_sub = load_font(30)
    subtitle = piece.get("subtitle", "")
    y += 8
    draw_centered_text(draw, subtitle, y, font_sub, subtitle_color, max_width=660)

    # ── Layer 4: Illustration ──
    icon = piece.get("icon", "🌱")
    if illustration_img:
        # Resize and paste provided illustration
        ill = illustration_img.convert("RGBA").resize((300, 300))
    else:
        ill = make_illustration_placeholder(icon, size=260,
              color=WHITE if version == "v3" else ENGRAVE_DARK)

    if version == "v2" and not illustration_img:
        # Color the icon for V2
        ill = make_illustration_placeholder(icon, size=260, color=theme)

    ill_x = (CANVAS_SIZE - ill.width) // 2
    ill_y = 370
    if ill.mode == "RGBA":
        img.paste(ill, (ill_x, ill_y), ill)
    else:
        img.paste(ill, (ill_x, ill_y))

    # ── Layer 5: Set name lower-left ──
    font_small = load_font(26, bold=False)
    set_name = piece.get("set_name", "")
    draw_text_at(draw, set_name, x=105, y=830, font=font_small, color=text_color)

    # ── Layer 6: Piece number lower-right ──
    piece_num = f"#{piece.get('piece_number', '?')}"
    draw_text_at(draw, piece_num, x=920, y=830, font=font_small, color=text_color, anchor="right")

    return img

# ─── BACK FACE ───────────────────────────────────────────────────────────────
def render_back(piece, version="v1"):
    """
    Render back face — checklist card.
    """
    theme = hex_color(piece.get("theme_color", "#2E7D32"))
    is_star = piece.get("piece_type") == "Star"
    is_heart = piece.get("piece_type") == "Heart"
    if is_star: theme = hex_color("#F9A825")
    if is_heart: theme = hex_color("#E91E63")

    # ── Layer 0: Base ──
    if version == "v3":
        img = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), (255,255,255))
        draw = ImageDraw.Draw(img)
        draw_hex_with_connectors(draw, 512, 512, HEX_RADIUS,
                                  fill=theme, outline=WHITE, outline_width=4)
        text_color = WHITE
        border_color = tuple(max(0, c-40) for c in theme)
        check_color = WHITE
        divider_color = tuple(min(255, c+60) for c in theme)
    else:
        img = make_wood_base(color=WOOD_LIGHT, lighter=True)
        draw = ImageDraw.Draw(img)
        text_color = ENGRAVE_DARK
        border_color = BORDER_BROWN
        check_color = ENGRAVE_DARK if version == "v1" else theme
        divider_color = BORDER_BROWN

    # ── Layer 1: Border ──
    draw_inner_border(draw, 512, 512, HEX_RADIUS, inset=28, color=border_color, width=3)

    # ── Layer 2: Back title ──
    font_title = load_font(40, bold=True)
    title = f"\u2713  {piece.get('title', '')}"
    y = 148
    draw_centered_text(draw, title, y, font_title, text_color, max_width=680)
    y = 205

    # ── Layer 3: Divider ──
    draw.line([(180, y), (844, y)], fill=divider_color, width=2)
    y += 18

    # ── Layer 4: Checklist ──
    font_item = load_font(27)
    activities = []
    for i in range(1, 8):
        act = piece.get(f"activity_{i}", "")
        if act and act.strip():
            activities.append(act.strip())

    line_gap = 14
    for act in activities:
        # Draw checkbox
        box_x, box_y = 130, y + 4
        box_size = 22
        draw.rectangle([box_x, box_y, box_x+box_size, box_y+box_size],
                        outline=check_color, width=2)
        # Draw text with wrapping
        max_text_w = 660
        words = act.split()
        lines = []
        current = ""
        for word in words:
            test = (current + " " + word).strip()
            bb = draw.textbbox((0,0), test, font=font_item)
            if bb[2]-bb[0] <= max_text_w:
                current = test
            else:
                if current: lines.append(current)
                current = word
        if current: lines.append(current)

        for li, line in enumerate(lines):
            tx = 165 if li == 0 else 165
            draw.text((tx, y), line, font=font_item, fill=text_color)
            y += (draw.textbbox((0,0), line, font=font_item)[3] - draw.textbbox((0,0), line, font=font_item)[1]) + 4
        y += line_gap

    # ── Layer 5: Star benefit ──
    font_benefit = load_font(24)
    star_ben = piece.get("star_benefit", "")
    if star_ben:
        y = max(y + 8, 730)
        star_color = STAR_GOLD if version != "v3" else WHITE
        draw_centered_text(draw, f"\u2b50  {star_ben}", y, font_benefit, star_color, max_width=680)
        y += 36

    # ── Layer 6: Heart benefit ──
    heart_ben = piece.get("heart_benefit", "")
    if heart_ben:
        heart_color = HEART_PINK if version != "v3" else WHITE
        draw_centered_text(draw, f"\u2764\ufe0f  {heart_ben}", y, font_benefit, heart_color, max_width=680)

    # ── Layer 7: Set name lower-left ──
    font_small = load_font(22)
    set_name = piece.get("set_name", "")
    draw_text_at(draw, set_name, x=105, y=840, font=font_small, color=text_color)

    # ── Layer 8: Piece number lower-right ──
    piece_num = f"#{piece.get('piece_number', '?')}"
    draw_text_at(draw, piece_num, x=920, y=840, font=font_small, color=text_color, anchor="right")

    return img

# ─── AUDIT ───────────────────────────────────────────────────────────────────
def audit_pieces(pieces):
    """Audit all piece data. Returns list of audit results."""
    results = []
    seen_numbers = {}
    seen_titles = {}

    KNOWN_SET_NAMES = {"Lucky7", "Food Waste", "Wormspire"}

    for p in pieces:
        issues = []
        warnings = []
        num = p.get("piece_number", "?")

        # Required fields
        for field in ["piece_number", "short_name", "title", "subtitle", "icon",
                      "theme_color", "set_name", "set_folder", "piece_type",
                      "star_benefit", "heart_benefit"]:
            if not p.get(field, "").strip():
                issues.append(f"Missing required field: {field}")

        # Title length
        title = p.get("title", "")
        if len(title) > 45:
            warnings.append(f"Title too long ({len(title)} chars, max 45): '{title}'")

        # Subtitle length
        subtitle = p.get("subtitle", "")
        if len(subtitle) > 60:
            warnings.append(f"Subtitle too long ({len(subtitle)} chars, max 60)")

        # Activity count
        activities = [p.get(f"activity_{i}", "").strip() for i in range(1,8) if p.get(f"activity_{i}", "").strip()]
        if len(activities) < 3:
            issues.append(f"Too few activities ({len(activities)}, min 3)")
        if len(activities) > 7:
            issues.append(f"Too many activities ({len(activities)}, max 7)")

        # Star/Heart pieces: max 3 activities is fine
        if p.get("piece_type") in ("Star", "Heart") and len(activities) > 4:
            warnings.append("Star/Heart pieces usually have 3-4 activities")

        # Duplicate piece number
        if num in seen_numbers:
            issues.append(f"Duplicate piece_number {num} (also on {seen_numbers[num]})")
        else:
            seen_numbers[num] = p.get("short_name")

        # Duplicate title
        if title in seen_titles:
            warnings.append(f"Duplicate title '{title}' (also piece {seen_titles[title]})")
        else:
            seen_titles[title] = num

        # Theme color format
        tc = p.get("theme_color", "")
        if not (tc.startswith("#") and len(tc) == 7):
            issues.append(f"Invalid theme_color format: '{tc}'")

        # Set name known
        if p.get("set_name") not in KNOWN_SET_NAMES:
            warnings.append(f"Unknown set_name: '{p.get('set_name')}' — known: {KNOWN_SET_NAMES}")

        status = "PASS" if not issues else "FAIL"
        if warnings and status == "PASS":
            status = "WARN"

        results.append({
            "piece_number": num,
            "title": title,
            "status": status,
            "issues": issues,
            "warnings": warnings,
            "activity_count": len(activities),
        })

    return results

# ─── CSV LOADER ──────────────────────────────────────────────────────────────
def load_csv(path=CSV_PATH):
    pieces = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pieces.append(dict(row))
    return pieces

def save_csv(pieces, path=CSV_PATH):
    if not pieces:
        return
    fieldnames = list(pieces[0].keys())
    # Add new fields if not present
    extra = ["illustration_cdn_url", "v1_front_cdn", "v2_front_cdn", "v3_front_cdn",
             "v1_back_cdn", "v2_back_cdn", "v3_back_cdn", "render_params_json",
             "audit_status", "audit_notes"]
    for e in extra:
        if e not in fieldnames:
            fieldnames.append(e)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(pieces)

# ─── RENDER ONE PIECE ────────────────────────────────────────────────────────
def render_piece(piece, output_dir=None):
    """Render all 6 images (3 versions × front+back) for one piece."""
    if not PIL_OK:
        print("Pillow not available — cannot render")
        return {}

    num = str(piece.get("piece_number", "0")).zfill(2)
    name = piece.get("short_name", "piece")
    folder = piece.get("set_folder", "unknown_set")

    if output_dir is None:
        output_dir = ROOT / folder / "pieces"
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    paths = {}
    for version in ("v1", "v2", "v3"):
        # Front
        front_img = render_front(piece, version=version)
        front_path = output_dir / f"piece_{num}_{name}_front_{version}.png"
        front_img.save(str(front_path))
        paths[f"front_{version}"] = str(front_path)

        # Back
        back_img = render_back(piece, version=version)
        back_path = output_dir / f"piece_{num}_{name}_back_{version}.png"
        back_img.save(str(back_path))
        paths[f"back_{version}"] = str(back_path)

        print(f"  ✅ {version} front + back → {front_path.name}, {back_path.name}")

    # Render params (everything needed to reproduce exactly)
    params = {
        "piece_number": piece.get("piece_number"),
        "short_name": name,
        "theme_color": piece.get("theme_color"),
        "piece_type": piece.get("piece_type"),
        "canvas_size": CANVAS_SIZE,
        "hex_radius": HEX_RADIUS,
        "tab_w": TAB_W,
        "tab_h": TAB_H,
        "tab_r": TAB_R,
        "title_font_size": 52,
        "subtitle_font_size": 30,
        "checklist_font_size": 27,
        "title_y": 155,
        "subtitle_y": 215,
        "illustration_y": 370,
        "set_name_x": 105,
        "set_name_y": 830,
        "piece_num_x": 920,
        "piece_num_y": 830,
        "rendered_at": datetime.now().isoformat(),
        "template_version": "gold_2026-04-15",
    }
    paths["render_params"] = params
    return paths

# ─── MAIN ────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Puzzle4Life Piece Pipeline")
    parser.add_argument("--stage", choices=["audit", "render", "full"], default="audit")
    parser.add_argument("--piece", type=int, help="Render single piece by number")
    parser.add_argument("--set", type=str, help="Render all pieces in a set folder")
    parser.add_argument("--all", action="store_true", help="Process all pieces")
    args = parser.parse_args()

    print(f"\n🎋 Puzzle4Life Pipeline — Stage: {args.stage.upper()}")
    print(f"   CSV: {CSV_PATH}")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    pieces = load_csv()
    print(f"   Loaded {len(pieces)} pieces from CSV\n")

    # ── AUDIT ──
    if args.stage in ("audit", "full"):
        print("━━━ STAGE 1: AUDIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        audit_results = audit_pieces(pieces)
        passes = sum(1 for r in audit_results if r["status"] == "PASS")
        warns  = sum(1 for r in audit_results if r["status"] == "WARN")
        fails  = sum(1 for r in audit_results if r["status"] == "FAIL")

        for r in audit_results:
            icon = "✅" if r["status"]=="PASS" else ("⚠️ " if r["status"]=="WARN" else "❌")
            print(f"  {icon} #{r['piece_number']:>2} {r['title'][:35]:<35} "
                  f"[{r['activity_count']} activities]")
            for issue in r["issues"]:
                print(f"       ❌ {issue}")
            for warn in r["warnings"]:
                print(f"       ⚠️  {warn}")

        print(f"\n  Summary: {passes} PASS  |  {warns} WARN  |  {fails} FAIL\n")

        # Save audit report
        with open(AUDIT_PATH, 'w') as f:
            json.dump(audit_results, f, indent=2)
        print(f"  📄 Audit report saved → {AUDIT_PATH}\n")

        # Update CSV with audit status
        audit_map = {str(r["piece_number"]): r for r in audit_results}
        for p in pieces:
            num = str(p.get("piece_number", ""))
            if num in audit_map:
                r = audit_map[num]
                p["audit_status"] = r["status"]
                p["audit_notes"] = "; ".join(r["issues"] + r["warnings"])
        save_csv(pieces)

    # ── RENDER ──
    if args.stage in ("render", "full"):
        print("━━━ STAGE 2: RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        # Select which pieces to render
        to_render = []
        if args.piece:
            to_render = [p for p in pieces if str(p.get("piece_number")) == str(args.piece)]
        elif args.set:
            to_render = [p for p in pieces if p.get("set_folder") == args.set]
        elif args.all:
            to_render = pieces
        else:
            print("  ℹ️  No pieces selected. Use --piece N, --set name, or --all")
            return

        print(f"  Rendering {len(to_render)} piece(s)...\n")
        for piece in to_render:
            print(f"  🎋 Piece #{piece.get('piece_number')} — {piece.get('title')}")
            paths = render_piece(piece)

            # Update CSV row
            for p in pieces:
                if str(p.get("piece_number")) == str(piece.get("piece_number")):
                    p["v1_front_cdn"] = paths.get("front_v1", "")
                    p["v2_front_cdn"] = paths.get("front_v2", "")
                    p["v3_front_cdn"] = paths.get("front_v3", "")
                    p["v1_back_cdn"]  = paths.get("back_v1", "")
                    p["v2_back_cdn"]  = paths.get("back_v2", "")
                    p["v3_back_cdn"]  = paths.get("back_v3", "")
                    p["render_params_json"] = json.dumps(paths.get("render_params", {}))
                    p["status"] = "Rendered"
                    break
            print()

        save_csv(pieces)
        print(f"  💾 CSV updated → {CSV_PATH}\n")
        print(f"  ✅ Render complete — {len(to_render)} pieces, 6 images each\n")

if __name__ == "__main__":
    main()
