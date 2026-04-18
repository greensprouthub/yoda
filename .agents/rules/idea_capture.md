# Idea Capture Rule

## Rule
Whenever an idea comes up in conversation — regardless of context — save it to the IdeaParkingLot entity immediately, without waiting to be asked.

## Applies to
- Any new product idea
- Any brand / content / strategy tangent
- Any "what if..." or "we could also..." thought
- Any improvement or iteration on an existing idea
- Any tool, automation, or system concept
- Half-baked ideas count too — park them, don't filter them

## Fields to fill
- title: Short punchy name
- description: Full idea with enough context to understand it cold (no context window assumed)
- category: Product / Strategy / Content / Tech / Event / Partnership / Brand
- status: "Parked"
- priority: High / Medium / Low based on urgency/impact
- notes: Which brand it applies to, event relevance, doability, related ideas

## Why
Context windows end. Sessions end. Ideas disappear. The IdeaParkingLot is the permanent brain. Always save — Baris can always delete, but can never recover a lost idea.

---

# Puzzle4Life Auto-Extract Rule

## Rule
Whenever a YouTube video, article, newsletter, podcast, or any content source is discussed or analyzed — ALWAYS extract insights and create Puzzle4Life piece concepts from them immediately. No asking, no confirming. Just do it.

## What to extract
- Any actionable habit, behavior, or mindset shift
- Any framework, model, or system that can become a checklist
- Any insight that maps to "1% better" thinking
- Any challenge, practice, or ritual worth repeating daily

## How to save
1. Create GshIntel records (batch intel) for the raw insights
2. Create Puzzle4LifePiece records (status: "Backlog" / in_backlog: true) for piece concepts worth producing
   - Fill: piece_number (auto-increment from last), short_name, title, subtitle, icon, theme_color, set_name, piece_type, activities (3-7), star_benefit, heart_benefit
   - Use next available piece number (currently 27+ is the next unassigned range)

## Why
Every insight from every source is potential Puzzle4Life content. The whole system feeds itself. Never let a good idea escape without being captured as a piece.
