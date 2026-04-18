from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, 
                                 Table, TableStyle, HRFlowable, PageBreak,
                                 KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Flowable
import re

GREEN_DARK = HexColor('#1B5E20')
GREEN_MID  = HexColor('#2E7D32')
GREEN_LIGHT= HexColor('#43A047')
GREEN_BG   = HexColor('#E8F5E9')
GREEN_PALE = HexColor('#F1F8E9')
GRAY_DARK  = HexColor('#1a1a1a')
GRAY_MID   = HexColor('#555555')
CODE_BG    = HexColor('#263238')
CODE_FG    = HexColor('#ECEFF1')
YELLOW_HL  = HexColor('#FFF9C4')

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

STYLES = {
    'cover_title': S('CoverTitle', fontName='Helvetica-Bold', fontSize=32, 
                     textColor=white, leading=40, spaceAfter=8),
    'cover_sub':   S('CoverSub', fontName='Helvetica', fontSize=15, 
                     textColor=HexColor('#C8E6C9'), leading=22, spaceAfter=20),
    'cover_badge': S('CoverBadge', fontName='Helvetica', fontSize=11, 
                     textColor=white, leading=16),
    'h1':  S('H1', fontName='Helvetica-Bold', fontSize=20, textColor=GREEN_DARK,
              spaceBefore=24, spaceAfter=8, leading=26),
    'h2':  S('H2', fontName='Helvetica-Bold', fontSize=15, textColor=GREEN_MID,
              spaceBefore=18, spaceAfter=6, leading=20),
    'h3':  S('H3', fontName='Helvetica-Bold', fontSize=13, textColor=GREEN_LIGHT,
              spaceBefore=14, spaceAfter=4, leading=18),
    'body': S('Body', fontName='Helvetica', fontSize=11, textColor=GRAY_DARK,
               leading=17, spaceAfter=8),
    'body_bold': S('BodyBold', fontName='Helvetica-Bold', fontSize=11, 
                   textColor=GRAY_DARK, leading=17, spaceAfter=4),
    'bullet': S('Bullet', fontName='Helvetica', fontSize=11, textColor=GRAY_DARK,
                leading=17, spaceAfter=4, leftIndent=20, bulletIndent=6),
    'code':  S('Code', fontName='Courier', fontSize=9, textColor=CODE_FG,
                backColor=CODE_BG, leading=14, spaceAfter=12, 
                leftIndent=12, rightIndent=12, spaceBefore=8,
                borderPadding=(8,8,8,8)),
    'quote': S('Quote', fontName='Helvetica-Oblique', fontSize=11, 
               textColor=GREEN_MID, backColor=GREEN_PALE, leading=18,
               leftIndent=16, rightIndent=16, spaceAfter=12, spaceBefore=8,
               borderPadding=(10,10,10,10)),
    'step_label': S('StepLabel', fontName='Helvetica-Bold', fontSize=13,
                    textColor=white, leading=18),
    'footer': S('Footer', fontName='Helvetica', fontSize=9, textColor=white,
                leading=14, alignment=TA_CENTER),
    'cta':   S('CTA', fontName='Helvetica-Bold', fontSize=12, textColor=GREEN_DARK,
               leading=18, alignment=TA_CENTER, spaceAfter=6),
    'checkbox': S('Checkbox', fontName='Helvetica', fontSize=11, textColor=GRAY_DARK,
                  leading=18, leftIndent=16, spaceAfter=3),
}

class ColorBox(Flowable):
    def __init__(self, color, height=60, content=None):
        self.color = color
        self.box_height = height
        self.content = content
        Flowable.__init__(self)
    def wrap(self, w, h):
        self.width = w
        return w, self.box_height
    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.box_height, fill=1, stroke=0)

class StepBanner(Flowable):
    def __init__(self, number, title, time_est, tool):
        self.number = number
        self.title = title
        self.time_est = time_est
        self.tool = tool
        Flowable.__init__(self)
    def wrap(self, w, h):
        self.width = w
        return w, 54
    def draw(self):
        c = self.canv
        c.setFillColor(GREEN_MID)
        c.roundRect(0, 0, self.width, 54, 6, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 22)
        c.drawString(16, 28, f'STEP {self.number}')
        c.setFont('Helvetica-Bold', 13)
        c.drawString(16, 12, self.title)
        c.setFont('Helvetica', 10)
        c.setFillColor(HexColor('#C8E6C9'))
        c.drawRightString(self.width - 16, 36, f'⏱ {self.time_est}')
        c.drawRightString(self.width - 16, 20, f'🛠 {self.tool}')

class CoverPage(Flowable):
    def __init__(self, width, height):
        self.page_width = width
        self.page_height = height
        Flowable.__init__(self)
    def wrap(self, w, h):
        return self.page_width, 260
    def draw(self):
        c = self.canv
        # gradient-ish background
        c.setFillColor(GREEN_DARK)
        c.rect(0, 0, self.page_width, 260, fill=1, stroke=0)
        c.setFillColor(GREEN_MID)
        c.rect(0, 0, self.page_width * 0.6, 260, fill=1, stroke=0)
        # title
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 34)
        c.drawString(40, 200, 'From Idea to MVP')
        c.setFont('Helvetica-Bold', 34)
        c.drawString(40, 162, 'in a Weekend')
        c.setFont('Helvetica', 14)
        c.setFillColor(HexColor('#C8E6C9'))
        c.drawString(40, 136, 'The AI-Powered Founder Playbook')
        c.setFont('Helvetica-Bold', 13)
        c.setFillColor(HexColor('#A5D6A7'))
        c.drawString(40, 116, 'GreenSprout Hub — greensprouthub.ai')
        # badge
        c.setFillColor(HexColor('#33691E'))
        c.roundRect(40, 28, 440, 70, 8, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 11)
        c.drawString(56, 80, '✅  Turn a raw idea into a live website, logo & brand')
        c.setFont('Helvetica', 11)
        c.drawString(56, 62, 'No code. No agency. No excuses.')
        c.drawString(56, 44, '⏱ One weekend  •  💰 Under $50  •  🤖 AI-powered end to end')

def build_pdf():
    doc = SimpleDocTemplate(
        '/app/lead_magnets/idea_to_mvp_playbook.pdf',
        pagesize=letter,
        rightMargin=54, leftMargin=54,
        topMargin=40, bottomMargin=54,
        title='From Idea to MVP in a Weekend',
        author='GreenSprout Hub LLC'
    )
    
    W = letter[0]
    story = []
    
    # COVER
    story.append(CoverPage(W - 108, letter[1]))
    story.append(Spacer(1, 20))
    
    # WHO THIS IS FOR
    story.append(Paragraph('Who This Is For', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=2, color=GREEN_LIGHT))
    story.append(Spacer(1, 8))
    
    for line in [
        '• Engineers, PMs, or professionals pivoting after AI disruption',
        '• Makers and hobbyists who want to monetize what they love',
        '• Small business owners who want a second income stream',
        '• Anyone who keeps saying "I should start something" — and means it this time',
    ]:
        story.append(Paragraph(line, STYLES['bullet']))
    story.append(Spacer(1, 12))
    
    # WHAT YOU GET
    story.append(Paragraph('What You Will Have by the End', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=2, color=GREEN_LIGHT))
    story.append(Spacer(1, 8))
    
    outcomes = [
        ['✅', 'A validated, refined brand idea'],
        ['✅', 'A domain name registered and ready'],
        ['✅', 'A logo that looks professional'],
        ['✅', 'A live website with a lead capture form'],
        ['✅', 'A visibility audit report on your site'],
        ['✅', 'Social posts to announce your launch'],
        ['✅', 'A repeatable system for your next idea'],
    ]
    t = Table(outcomes, colWidths=[30, 380])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 11),
        ('TEXTCOLOR', (0,0), (-1,-1), GRAY_DARK),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1,0), (1,-1), GREEN_DARK),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [GREEN_PALE, white]),
        ('ROWPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('ROUNDEDCORNERS', [4]),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))
    
    meta = [
        ['⏱ Time Required', '8–12 hours (one focused weekend)'],
        ['💰 Total Cost', 'Under $50 (domain + tools)'],
    ]
    mt = Table(meta, colWidths=[160, 250])
    mt.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 11),
        ('TEXTCOLOR', (0,0), (0,-1), GREEN_MID),
        ('TEXTCOLOR', (1,0), (1,-1), GRAY_DARK),
        ('BACKGROUND', (0,0), (-1,-1), GREEN_BG),
        ('ROWPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
    ]))
    story.append(mt)
    story.append(Spacer(1, 20))
    
    # FRAMEWORK
    story.append(Paragraph('The 7-Step Framework', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=2, color=GREEN_LIGHT))
    story.append(Spacer(1, 8))
    
    steps_row = [['IDEA', '→', 'REFINE', '→', 'BRAND', '→', 'BUILD', '→', 'AUDIT', '→', 'LAUNCH', '→', 'REPEAT']]
    st = Table(steps_row, colWidths=[50,16,50,16,50,16,50,16,50,16,55,16,55])
    colors_alternating = [GREEN_MID if i % 2 == 0 else white for i in range(13)]
    st.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (-1,-1), GREEN_MID),
        ('TEXTCOLOR', (0,0), (0,0), white),
        ('TEXTCOLOR', (2,0), (2,0), white),
        ('TEXTCOLOR', (4,0), (4,0), white),
        ('TEXTCOLOR', (6,0), (6,0), white),
        ('TEXTCOLOR', (8,0), (8,0), white),
        ('TEXTCOLOR', (10,0), (10,0), white),
        ('TEXTCOLOR', (12,0), (12,0), white),
        ('BACKGROUND', (0,0), (0,0), GREEN_DARK),
        ('BACKGROUND', (2,0), (2,0), GREEN_MID),
        ('BACKGROUND', (4,0), (4,0), GREEN_MID),
        ('BACKGROUND', (6,0), (6,0), GREEN_MID),
        ('BACKGROUND', (8,0), (8,0), GREEN_MID),
        ('BACKGROUND', (10,0), (10,0), GREEN_LIGHT),
        ('BACKGROUND', (12,0), (12,0), GREEN_LIGHT),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(st)
    story.append(Spacer(1, 24))
    
    # STEPS
    step_data = [
        (1, 'Capture and Refine Your Idea with ChatGPT', '30–60 min', 'ChatGPT GPT-4',
         'Most ideas die in the "vague" phase. The first job is to make it concrete.',
         [
             ('Paste this prompt into ChatGPT:', 
              'I have a business idea: [YOUR IDEA IN 1-2 SENTENCES].\n\nHelp me:\n1. Identify the target customer (be specific — age, job, pain)\n2. Name the core problem this solves\n3. Describe the transformation (before vs after)\n4. List 3 competing solutions that already exist\n5. Identify what makes this different\n6. Suggest 5 possible brand names (short, memorable, .com available)\n7. Write a one-sentence value proposition'),
             ('Real GSH example — Wormspire:',
              'Target: Urban renters 28-45 who want to compost but have no yard\nProblem: Traditional bins smell, attract pests, need outdoor space\nTransformation: From throwing food scraps in the trash → garden gold in 30 days, indoors\nNames generated: Wormspire, CastleCast, VermiStack, WormUp, TowerCompost'),
         ],
         'Copy the full ChatGPT output into a Google Doc. This becomes your brand brief.'
        ),
        (2, 'Generate the AI Build Prompt', '15–20 min', 'ChatGPT → Base44',
         "Once your idea is refined, convert it into a precise AI build prompt. A good prompt is the difference between a generic site and something that actually converts.",
         [
             ('Paste this into ChatGPT to generate your build prompt:',
              'Based on this brand brief:\n- Brand name: [NAME]\n- Target customer: [DESCRIPTION]\n- Core problem: [PROBLEM]\n- Core transformation: [BEFORE → AFTER]\n- Tone: [e.g., warm and practical]\n\nWrite a detailed AI build prompt for Base44 or Lovable. Include:\n- Hero section (headline + subheadline)\n- Problem section (3 pain points)\n- Solution section (3 benefits)\n- Social proof placeholder\n- Lead capture form (name + email + biggest challenge)\n- CTA button copy\n- Color palette (hex codes)\n- Font style'),
         ],
         'Copy the generated prompt exactly. You will paste this into Base44 or Lovable in Step 3.'
        ),
        (3, 'Build the Website in Base44 or Lovable', '1–2 hours', 'Base44 / Lovable',
         'Two platforms, two strengths. Pick the one that fits your goal.',
         [
             ('Option A — Base44 (recommended for AI agent + database):',
              '1. Go to app.base44.com\n2. Click New App\n3. Paste your full build prompt from Step 2\n4. Base44 generates pages, forms, and a live backend\n5. Lead capture form automatically saves to a database\n6. No code needed — edit any component visually'),
             ('Option B — Lovable (recommended for visual polish):',
              '1. Go to lovable.dev → New Project\n2. Paste your build prompt\n3. Lovable generates a React-based site with beautiful UI\n4. Connect to Supabase for data storage\n5. Export to GitHub when ready'),
         ],
         'Tip: If the first output is not quite right, refine — don\'t rebuild. Type: "Change the hero headline to be more urgent." Always ask for a mobile-responsive layout and a lead capture form.'
        ),
        (4, 'Find and Register Your Domain', '20–30 min', 'GoDaddy + ChatGPT',
         'The right domain name is short, memorable, and available. Let ChatGPT do the brainstorming.',
         [
             ('Generate domain ideas with ChatGPT:',
              'Brand name: [NAME]\nBrand idea: [ONE SENTENCE]\n\nSuggest 10 domains across these formats:\n- Exact match: brandname.com\n- AI extension: brandname.ai\n- Action prefix: getbrandname.com, trybrandname.com\n- Niche extensions: .io, .co, .app\n\nPrioritize: under 15 characters, easy to spell, memorable.'),
             ('Important — separate brand from registration:',
              'GoDaddy = domain registration only\nBase44 or Lovable = where the website lives\nGoogle Workspace ($6/mo) = professional email (you@yourbrand.com)\n\nPoint your GoDaddy domain to your site using DNS settings (both platforms provide step-by-step guides).'),
         ],
         'Register for 2 years minimum (~$25–40 total). .com first, .ai as premium alternative.'
        ),
        (5, 'Create Your Logo', '30–45 min', 'ChatGPT → Base44 Image Gen',
         'Generate a logo prompt with ChatGPT, then use an AI image generator to create variations.',
         [
             ('Generate a logo prompt with ChatGPT:',
              'Brand name: [NAME]\nBrand vibe: [earthy / modern tech / bold]\nTarget audience: [DESCRIPTION]\nCore product: [WHAT IT IS]\n\nWrite a detailed logo generation prompt. Include:\n- Icon style (minimal, flat, line art)\n- Color palette (2-3 hex codes)\n- Typography style\n- What the icon should represent\n- What to avoid'),
             ('Export formats you need:',
              '• PNG with transparent background (for website)\n• Square version (for social media profile)\n• Favicon (32x32px for browser tab)'),
         ],
         'Generate 4-6 variations. Refine by telling ChatGPT what is not quite working. Regenerate until you love it.'
        ),
        (6, 'Run the Fix My Visibility Audit', '30–45 min', 'Fix My Visibility (GSH)',
         'Before you announce anything, audit your site. You do not get a second chance at a first impression.',
         [
             ('What the audit checks:',
              '⚡ Page load speed (under 3 seconds)\n📱 Mobile responsiveness score\n🔍 SEO basics (title tag, meta description, H1)\n🔒 Security (HTTPS, SSL certificate)\n🖼 Image optimization\n📋 Form functionality\n🔗 Broken links'),
             ('How to fix issues — paste audit report into ChatGPT:',
              'Here is my website audit report: [paste report]\nI built this on [Base44 / Lovable].\nFor each issue flagged, tell me exactly how to fix it — step by step, no code experience assumed.'),
         ],
         'Implement fixes, re-run the audit. Aim for a green score before launch.'
        ),
        (7, 'Launch and Announce', '45–60 min', 'ChatGPT → All Platforms',
         'Generate platform-specific launch posts in minutes. The process story always outperforms polished marketing.',
         [
             ('Generate all launch posts at once:',
              'I just launched [NAME]. Here\'s the context:\n- What it does: [ONE SENTENCE]\n- Who it\'s for: [TARGET CUSTOMER]\n- Transformation: [BEFORE → AFTER]\n- Website: [URL]\n\nWrite launch posts for:\n1. Facebook (personal story, 150 words)\n2. Instagram (3 lines + 5 hashtags)\n3. LinkedIn (founder story, 200 words)\n4. Reddit (community-first, not salesy)\n5. WhatsApp broadcast (short + CTA)'),
         ],
         'The magic sentence every post needs: "I built this in [X days] using AI — here\'s how, and here\'s the link." People are obsessed with the process right now.'
        ),
    ]
    
    for num, title, time_est, tool, intro, blocks, tip in step_data:
        story.append(StepBanner(num, title, time_est, tool))
        story.append(Spacer(1, 10))
        story.append(Paragraph(intro, STYLES['body']))
        
        for label, content in blocks:
            story.append(Paragraph(label, STYLES['h3']))
            story.append(Paragraph(content.replace('\n', '<br/>'), STYLES['code']))
        
        # tip box
        tip_table = Table([[Paragraph(f'💡 <b>Key Takeaway:</b> {tip}', STYLES['body'])]], 
                          colWidths=[430])
        tip_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), YELLOW_HL),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('RIGHTPADDING', (0,0), (-1,-1), 14),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('ROUNDEDCORNERS', [4]),
        ]))
        story.append(tip_table)
        story.append(Spacer(1, 20))
    
    # WEEKEND SCHEDULE
    story.append(PageBreak())
    story.append(Paragraph('Your Weekend Schedule', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=2, color=GREEN_LIGHT))
    story.append(Spacer(1, 8))
    
    sched = [
        ['When', 'What to do'],
        ['Saturday Morning\n(2–3 hours)', '☐ Step 1 — Refine idea with ChatGPT\n☐ Step 2 — Generate build prompt\n☐ Step 3 — Build site in Base44 or Lovable'],
        ['Saturday Afternoon\n(2 hours)', '☐ Step 4 — Find and register domain\n☐ Step 5 — Create logo (3 variations minimum)'],
        ['Sunday Morning\n(2 hours)', '☐ Connect domain to website\n☐ Upload logo, update brand colors\n☐ Step 6 — Run Fix My Visibility audit\n☐ Fix top 3 issues from audit'],
        ['Sunday Afternoon\n(1–2 hours)', '☐ Step 7 — Generate and schedule all launch posts\n☐ Go live\n☐ DM 10 real people personally (not broadcast)'],
    ]
    st2 = Table(sched, colWidths=[160, 290])
    st2.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 11),
        ('BACKGROUND', (0,0), (-1,0), GREEN_DARK),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,1), (0,-1), GREEN_MID),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [GREEN_PALE, white]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#C8E6C9')),
    ]))
    story.append(st2)
    story.append(Spacer(1, 28))
    
    # HORMOZI LAYER
    story.append(Paragraph('Bonus: The Hormozi Lead Magnet Layer', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=2, color=GREEN_LIGHT))
    story.append(Spacer(1, 8))
    story.append(Paragraph('Once your site is live, add a lead magnet immediately. Never just ask people to "contact you."', STYLES['body']))
    story.append(Spacer(1, 8))
    
    magnet_types = [
        ['Type 1 — Reveal a Problem', 
         'Show them something is broken they didn\'t know about. Creates urgency.\n\nExample: "Is your website invisible? Run our free visibility scan." → Fix My Visibility audit'],
        ['Type 2 — Free Trial or Sample', 
         'Let them taste the product, then remove access. They want more.\n\nExample: "Get one free Puzzle4Life piece — just pay $4.99 shipping" → they touch it, they want the full set'],
        ['Type 3 — One Step of Many', 
         'Give them step 1 free, sell steps 2-10.\n\nExample: "Download the free LLC checklist — step 1 of your business setup" → upsell to the full back-office bundle'],
    ]
    
    for type_name, type_desc in magnet_types:
        mt2 = Table([[Paragraph(f'<b>{type_name}</b>', STYLES['body']), 
                      Paragraph(type_desc.replace('\n', '<br/>'), STYLES['body'])]], 
                    colWidths=[160, 290])
        mt2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), GREEN_MID),
            ('BACKGROUND', (1,0), (1,0), GREEN_PALE),
            ('TEXTCOLOR', (0,0), (0,0), white),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('GRID', (0,0), (-1,-1), 0.5, HexColor('#C8E6C9')),
        ]))
        story.append(mt2)
        story.append(Spacer(1, 4))
    
    story.append(Spacer(1, 16))
    story.append(Paragraph('<b>Naming Formula (Hormozi):</b> <i>[Number] + [Specific Outcome] + [Timeframe]</i>', STYLES['body']))
    story.append(Paragraph('"3 Signs Your Compost Bin Is Failing (And How to Fix It This Weekend)"', STYLES['quote']))
    story.append(Paragraph('"How to Go From Employee to Founder in 90 Days Without Quitting Your Job Yet"', STYLES['quote']))
    story.append(Paragraph('"5 Website Mistakes Killing Your Local Business (Free Scan)"', STYLES['quote']))
    story.append(Spacer(1, 20))
    
    # TOOLS TABLE
    story.append(Paragraph('Tools Summary', STYLES['h1']))
    story.append(HRFlowable(width='100%', thickness=2, color=GREEN_LIGHT))
    story.append(Spacer(1, 8))
    
    tools = [
        ['Step', 'Tool', 'Cost'],
        ['1. Idea refinement', 'ChatGPT (GPT-4)', 'Free / $20/mo'],
        ['2. Build prompt', 'ChatGPT', 'Free'],
        ['3. Website builder', 'Base44 or Lovable', 'Free tier available'],
        ['4. Domain', 'GoDaddy', '$12–25/yr'],
        ['5. Logo', 'Base44 Image Gen or Midjourney', 'Free / $10/mo'],
        ['6. Visibility audit', 'Fix My Visibility (GSH)', 'Free'],
        ['7. Social posts', 'ChatGPT', 'Free'],
        ['TOTAL', '', 'Under $50 + one weekend'],
    ]
    tt = Table(tools, colWidths=[170, 170, 110])
    tt.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 11),
        ('BACKGROUND', (0,0), (-1,0), GREEN_DARK),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [white, GREEN_PALE]),
        ('BACKGROUND', (0,-1), (-1,-1), GREEN_MID),
        ('TEXTCOLOR', (0,-1), (-1,-1), white),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 9),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#C8E6C9')),
    ]))
    story.append(tt)
    story.append(Spacer(1, 28))
    
    # CTA
    cta_table = Table([[
        Paragraph('Want the Done-For-You Version?\n\nSkip the steps and just have it done. GreenSproutHub.ai handles: Idea → Brand → Domain → Logo → Website → Audit → Launch posts. You handle the idea and the decision.\n\n👉 Apply for a free strategy call: greensprouthub.ai/contact\n\n📚 Apply for a free physical book (limited copies — just pay shipping): greensprouthub.ai/free-book', STYLES['cta'])
    ]], colWidths=[450])
    cta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GREEN_BG),
        ('LEFTPADDING', (0,0), (-1,-1), 24),
        ('RIGHTPADDING', (0,0), (-1,-1), 24),
        ('TOPPADDING', (0,0), (-1,-1), 20),
        ('BOTTOMPADDING', (0,0), (-1,-1), 20),
        ('ROUNDEDCORNERS', [8]),
        ('BOX', (0,0), (-1,-1), 2, GREEN_MID),
    ]))
    story.append(cta_table)
    story.append(Spacer(1, 20))
    
    # FOOTER
    footer_table = Table([[
        Paragraph('GreenSprout Hub LLC — Austin, TX  |  greensprouthub.ai  |  team@greensprouthub.com\nA founder-led AI lab. We build in public. We ship before we\'re ready.', STYLES['footer'])
    ]], colWidths=[450])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GREEN_DARK),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('TOPPADDING', (0,0), (-1,-1), 16),
        ('BOTTOMPADDING', (0,0), (-1,-1), 16),
    ]))
    story.append(footer_table)
    
    doc.build(story)
    print("PDF built successfully!")

build_pdf()
