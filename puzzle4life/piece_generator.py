#!/usr/bin/env python3
"""
Puzzle4Life Piece Generator
----------------------------
Takes an insight dict and generates:
  1. Structured puzzle piece (title, subtitle, icon, activities)
  2. SVG hexagonal card
  3. PNG card image (via Pillow)
  4. CSV log entry
  5. Puzzle4LifePiece entity record (returned for caller to save)

Usage:
  python3 piece_generator.py  <- runs built-in test
  OR import and call generate_piece(insight_dict)
"""

import json, os, re, sys, csv, math, textwrap
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE = Path("/app/puzzle4life")
CSV_PATH = BASE / "csv" / "master_pieces.csv"
IMG_PATH = BASE / "images"
SVG_PATH = BASE / "svg"

CATEGORY_COLORS = {
    "Mindset":        "#7B2D8B",
    "Habit":          "#2E7D32",
    "Business":       "#1565C0",
    "Sustainability": "#388E3C",
    "AI/Tech":        "#0277BD",
    "Relationships":  "#C62828",
    "Creativity":     "#F57C00",
    "Focus":          "#4527A0",
    "Health":         "#00838F",
    "Finance":        "#558B2F",
}

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text[:30]

def hex_color_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def darken(hex_color, factor=0.7):
    r, g, b = hex_color_to_rgb(hex_color)
    return (int(r * factor), int(g * factor), int(b * factor))

def next_piece_number():
    if not CSV_PATH.exists():
        return 1
    with open(CSV_PATH) as f:
        rows = list(csv.reader(f))
    data_rows = [r for r in rows[1:] if r and r[0].isdigit()]
    return len(data_rows) + 1

def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + 2*radius, y0 + 2*radius], fill=fill)
    draw.ellipse([x1 - 2*radius, y0, x1, y0 + 2*radius], fill=fill)
    draw.ellipse([x0, y1 - 2*radius, x0 + 2*radius, y1], fill=fill)
    draw.ellipse([x1 - 2*radius, y1 - 2*radius, x1, y1], fill=fill)

def draw_hexagon(draw, cx, cy, size, fill, outline=None, outline_width=2):
    points = []
    for i in range(6):
        angle = math.radians(60 * i - 30)
        x = cx + size * math.cos(angle)
        y = cy + size * math.sin(angle)
        points.append((x, y))
    draw.polygon(points, fill=fill, outline=outline)

def wrap_text(text, max_chars):
    return textwrap.wrap(text, width=max_chars)

def generate_png(piece):
    W, H = 420, 620
    color_hex = piece['theme_color']
    color_rgb = hex_color_to_rgb(color_hex)
    dark_rgb = darken(color_hex, 0.75)

    img = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Card shadow layer
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    draw_rounded_rect(sdraw, [8, 8, W-4, H-4], 20, (0, 0, 0, 40))

    # Card background
    draw_rounded_rect(draw, [4, 4, W-4, H-4], 20, (250, 250, 250, 255))

    # Top color band
    for y in range(4, 310):
        ratio = y / 310
        r = int(color_rgb[0] * (1 - ratio * 0.15))
        g = int(color_rgb[1] * (1 - ratio * 0.15))
        b = int(color_rgb[2] * (1 - ratio * 0.15))
        draw.line([(4, y), (W-4, y)], fill=(r, g, b))

    # Round top corners of color band
    draw_rounded_rect(draw, [4, 4, W-4, 50], 20, color_rgb)
    draw.rectangle([4, 30, W-4, 310], fill=color_rgb)

    # Piece number badge
    draw.ellipse([16, 16, 66, 66], fill=(255, 255, 255, 60))
    try:
        fn_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
        fn_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
        fn_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        fn_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 12)
        fn_act = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
        fn_cat = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 9)
        fn_footer = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 8)
    except:
        fn_bold = fn_small = fn_title = fn_sub = fn_act = fn_cat = fn_footer = ImageFont.load_default()

    draw.text((41, 41), f"#{piece['piece_number']:03d}", fill=(255,255,255), font=fn_bold, anchor='mm')

    # Category badge
    cat_text = piece['category'].upper()
    draw.rounded_rectangle([W-120, 18, W-14, 40], radius=10, fill=(255,255,255,50))
    draw.text((W-67, 29), cat_text, fill=(255,255,255), font=fn_cat, anchor='mm')

    # Hexagon icon
    draw_hexagon(draw, W//2, 115, 42, (255,255,255,50), outline=(255,255,255,120), outline_width=2)
    draw.text((W//2, 115), piece['icon'], fill=(255,255,255), font=fn_title, anchor='mm')

    # Title
    title_lines = wrap_text(piece['title'], 20)[:2]
    y_title = 175
    for line in title_lines:
        draw.text((W//2, y_title), line, fill=(255,255,255), font=fn_title, anchor='mm')
        y_title += 28

    # Subtitle
    sub_lines = wrap_text(piece['subtitle'], 38)[:2]
    y_sub = y_title + 8
    for line in sub_lines:
        draw.text((W//2, y_sub), line, fill=(255,255,255,200), font=fn_sub, anchor='mm')
        y_sub += 18

    # Divider
    draw.line([(30, 328), (W-30, 328)], fill=(220, 220, 220), width=1)

    # Activities header
    draw.text((34, 342), "PRACTICE ACTIVITIES", fill=color_rgb, font=fn_cat)

    # Activities with checkboxes
    y_act = 362
    for act in piece['activities'][:7]:
        # Checkbox
        draw.rounded_rectangle([34, y_act, 48, y_act+14], radius=3,
                               fill=None, outline=color_rgb)
        # Text
        act_text = act[:48] + ('…' if len(act) > 48 else '')
        draw.text((56, y_act + 7), act_text, fill=(50,50,50), font=fn_act, anchor='lm')
        y_act += 30

    # Footer
    footer = f"PUZZLE4LIFE™  ·  {piece['short_name'].upper()}"
    draw.text((W//2, H-18), footer, fill=(180,180,180), font=fn_footer, anchor='mm')

    # Merge shadow
    result = Image.alpha_composite(shadow, img)
    result = result.convert('RGB')
    return result

def generate_svg(piece):
    num = piece['piece_number']
    title = piece['title']
    subtitle = piece['subtitle']
    icon = piece['icon']
    color = piece['theme_color']
    activities = piece['activities'][:7]
    category = piece['category']
    short_name = piece['short_name']

    title_lines = textwrap.wrap(title, width=18)
    subtitle_lines = textwrap.wrap(subtitle, width=30)

    act_items = ""
    for i, act in enumerate(activities):
        act_short = act[:45] + ("…" if len(act) > 45 else "")
        y_offset = 378 + i * 30
        act_items += f'''
    <rect x="34" y="{y_offset - 13}" width="14" height="14" rx="3" fill="none" stroke="{color}" stroke-width="1.5"/>
    <text x="56" y="{y_offset}" font-family="Arial, sans-serif" font-size="11" fill="#333333">{act_short}</text>'''

    title_svg = ""
    for i, line in enumerate(title_lines[:2]):
        title_svg += f'\n    <text x="210" y="{185 + i*30}" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="white" text-anchor="middle">{line}</text>'

    sub_svg = ""
    start_y = 185 + len(title_lines[:2]) * 30 + 14
    for i, line in enumerate(subtitle_lines[:2]):
        sub_svg += f'\n    <text x="210" y="{start_y + i*18}" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.85)" text-anchor="middle" font-style="italic">{line}</text>'

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="420" height="620" viewBox="0 0 420 620" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g{num}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{color};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:{color};stop-opacity:0.85"/>
    </linearGradient>
    <filter id="shadow{num}">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.12"/>
    </filter>
    <clipPath id="card{num}">
      <rect x="4" y="4" width="412" height="612" rx="20"/>
    </clipPath>
  </defs>

  <!-- Shadow -->
  <rect x="8" y="8" width="412" height="612" rx="20" fill="rgba(0,0,0,0.08)"/>

  <!-- Card bg -->
  <rect x="4" y="4" width="412" height="612" rx="20" fill="#FAFAFA"/>

  <!-- Color band -->
  <rect x="4" y="4" width="412" height="310" rx="20" fill="url(#g{num})" clip-path="url(#card{num})"/>
  <rect x="4" y="290" width="412" height="30" fill="{color}" clip-path="url(#card{num})"/>

  <!-- Piece # badge -->
  <circle cx="40" cy="40" r="24" fill="rgba(255,255,255,0.2)"/>
  <text x="40" y="46" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">#{num:03d}</text>

  <!-- Category badge -->
  <rect x="298" y="18" width="118" height="24" rx="12" fill="rgba(255,255,255,0.2)"/>
  <text x="357" y="33" font-family="Arial,sans-serif" font-size="9" fill="white" text-anchor="middle" font-weight="bold" letter-spacing="0.5">{category.upper()}</text>

  <!-- Hex icon -->
  <polygon points="210,68 240,85 240,118 210,135 180,118 180,85" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
  <text x="210" y="110" font-family="Arial,sans-serif" font-size="28" text-anchor="middle">{icon}</text>

  <!-- Title -->
  {title_svg}

  <!-- Subtitle -->
  {sub_svg}

  <!-- Divider -->
  <line x1="30" y1="330" x2="390" y2="330" stroke="#E0E0E0" stroke-width="1"/>

  <!-- Activities label -->
  <text x="34" y="352" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="{color}" letter-spacing="1">PRACTICE ACTIVITIES</text>

  <!-- Activities -->
  {act_items}

  <!-- Footer -->
  <text x="210" y="606" font-family="Arial,sans-serif" font-size="8" fill="#BDBDBD" text-anchor="middle">PUZZLE4LIFE™  ·  {short_name.upper()}</text>
</svg>'''
    return svg

def append_to_csv(piece):
    acts = piece.get('activities', [])
    row = [
        piece.get('piece_number', ''),
        piece.get('short_name', ''),
        piece.get('title', ''),
        piece.get('subtitle', ''),
        piece.get('icon', ''),
        piece.get('category', ''),
        piece.get('theme_color', ''),
        acts[0] if len(acts) > 0 else '',
        acts[1] if len(acts) > 1 else '',
        acts[2] if len(acts) > 2 else '',
        acts[3] if len(acts) > 3 else '',
        acts[4] if len(acts) > 4 else '',
        acts[5] if len(acts) > 5 else '',
        acts[6] if len(acts) > 6 else '',
        piece.get('source_type', ''),
        piece.get('source_name', ''),
        piece.get('source_link', ''),
        piece.get('source_date', ''),
        piece.get('png_path', ''),
        piece.get('svg_path', ''),
        piece.get('png_url', ''),
        piece.get('status', 'Draft'),
    ]
    write_header = not CSV_PATH.exists() or CSV_PATH.stat().st_size == 0
    with open(CSV_PATH, 'a', newline='') as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(['piece_number','short_name','title','subtitle','icon','category','theme_color',
                             'activity_1','activity_2','activity_3','activity_4','activity_5','activity_6','activity_7',
                             'source_type','source_name','source_link','source_date','png_path','svg_path','png_url','status'])
        writer.writerow(row)

def generate_piece(insight: dict) -> dict:
    num = next_piece_number()
    short_name = slugify(insight.get('title', f'piece-{num}'))
    color = CATEGORY_COLORS.get(insight.get('category', 'Mindset'), '#7B2D8B')

    piece = {
        'piece_number': num,
        'short_name': short_name,
        'title': insight.get('title', ''),
        'subtitle': insight.get('subtitle', ''),
        'icon': insight.get('icon', '🧩'),
        'category': insight.get('category', 'Mindset'),
        'theme_color': color,
        'activities': insight.get('activities', []),
        'source_type': insight.get('source_type', 'Manual'),
        'source_name': insight.get('source_name', ''),
        'source_link': insight.get('source_link', ''),
        'source_date': insight.get('source_date', datetime.now().strftime('%Y-%m-%d')),
        'status': 'Generated',
        'in_backlog': True,
    }

    # SVG
    svg_content = generate_svg(piece)
    svg_file = SVG_PATH / f"{num:03d}_{short_name}.svg"
    with open(svg_file, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    piece['svg_path'] = str(svg_file)

    # PNG via Pillow
    png_file = IMG_PATH / f"{num:03d}_{short_name}.png"
    try:
        png_img = generate_png(piece)
        png_img.save(str(png_file), 'PNG', optimize=True)
        piece['png_path'] = str(png_file)
    except Exception as e:
        print(f"⚠️ PNG generation error: {e}")
        piece['png_path'] = ''

    # CSV
    append_to_csv(piece)

    print(f"✅ Piece #{num:03d}: {piece['title']}")
    print(f"   SVG → {piece['svg_path']}")
    print(f"   PNG → {piece['png_path']}")
    return piece


if __name__ == '__main__':
    samples = [
        {
            "title": "Isshin — One Mind",
            "subtitle": "The 300-year-old Japanese focus method that rewires your brain",
            "icon": "🎯",
            "category": "Focus",
            "activities": [
                "Choose ONE task before sitting down — no switching allowed",
                "Set a 25-min timer and close every other tab",
                "Write distracting thoughts on paper instead of acting on them",
                "Take a 5-min walk or stretch after each block",
                "Log how many unbroken Isshin blocks you complete each day",
                "Celebrate every unbroken block — small wins compound fast",
            ],
            "source_type": "YouTube",
            "source_name": "Presence & Purpose",
            "source_link": "https://youtube.com/watch?v=x4U1FdGeuwA",
            "source_date": "2026-04-09"
        },
        {
            "title": "90-Second Brain Capture",
            "subtitle": "How to earn someone's full attention in under two minutes",
            "icon": "🧠",
            "category": "Creativity",
            "activities": [
                "Open with a bold, specific claim — not a greeting",
                "State the problem you solve in 10 words or fewer",
                "Use one vivid story or statistic in the first 30 seconds",
                "Mirror the listener's body language and pacing",
                "End with a single clear call to action",
                "Practice your 90-second pitch daily — record yourself",
            ],
            "source_type": "YouTube",
            "source_name": "Chase Hughes",
            "source_link": "https://youtube.com/watch?v=B8LpmXimAOk",
            "source_date": "2026-04-09"
        },
        {
            "title": "Ambitious + Unfocused = Dangerous with AI",
            "subtitle": "How AI amplifies ambition — for better or worse",
            "icon": "⚡",
            "category": "AI/Tech",
            "activities": [
                "Define your ONE north star goal for this week — write it down",
                "Use AI only for tasks on your priority list, not distractions",
                "Set a daily 'AI office hours' — 30 min of focused AI leverage",
                "Review AI outputs critically — validate before you ship",
                "Track which AI tools saved you the most time this week",
                "Turn one manual task into an automation this month",
            ],
            "source_type": "YouTube",
            "source_name": "The MIT Monk",
            "source_link": "https://youtube.com/watch?v=m7U0353WlrQ",
            "source_date": "2026-04-09"
        }
    ]

    for s in samples:
        p = generate_piece(s)
        print()
