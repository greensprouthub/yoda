import markdown2
from weasyprint import HTML, CSS

with open('/app/lead_magnets/idea_to_mvp_playbook.md', 'r') as f:
    md_content = f.read()

html_body = markdown2.markdown(md_content, extras=["tables", "fenced-code-blocks", "strike", "task_list"])

html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  
  body {{
    font-family: 'Inter', Arial, sans-serif;
    font-size: 13px;
    line-height: 1.7;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }}
  
  .cover {{
    background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%);
    color: white;
    padding: 80px 60px;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }}
  
  .cover h1 {{
    font-size: 38px;
    font-weight: 900;
    margin: 0 0 12px 0;
    line-height: 1.2;
    color: white;
  }}
  
  .cover .subtitle {{
    font-size: 18px;
    opacity: 0.9;
    margin: 0 0 24px 0;
    color: #C8E6C9;
  }}
  
  .cover .badge {{
    display: inline-block;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
  }}
  
  .content {{
    padding: 40px 60px;
    max-width: 100%;
  }}
  
  h1 {{ 
    font-size: 28px; 
    font-weight: 800;
    color: #1B5E20;
    margin-top: 40px;
    margin-bottom: 12px;
    border-bottom: 3px solid #C8E6C9;
    padding-bottom: 8px;
  }}
  
  h2 {{ 
    font-size: 20px; 
    font-weight: 700;
    color: #2E7D32;
    margin-top: 32px;
    margin-bottom: 8px;
  }}
  
  h3 {{ 
    font-size: 16px; 
    font-weight: 600;
    color: #388E3C;
    margin-top: 24px;
    margin-bottom: 6px;
  }}
  
  p {{ margin: 0 0 12px 0; }}
  
  blockquote {{
    background: #F1F8E9;
    border-left: 4px solid #43A047;
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #2E7D32;
  }}
  
  code {{
    background: #F5F5F5;
    border: 1px solid #E0E0E0;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #1B5E20;
  }}
  
  pre {{
    background: #263238;
    color: #ECEFF1;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    font-size: 12px;
    line-height: 1.6;
  }}
  
  pre code {{
    background: none;
    border: none;
    color: #ECEFF1;
    padding: 0;
    font-size: 12px;
  }}
  
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }}
  
  th {{
    background: #2E7D32;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }}
  
  td {{
    padding: 9px 14px;
    border-bottom: 1px solid #E8F5E9;
  }}
  
  tr:nth-child(even) td {{
    background: #F9FBE7;
  }}
  
  ul, ol {{
    margin: 8px 0 16px 0;
    padding-left: 24px;
  }}
  
  li {{
    margin-bottom: 6px;
  }}
  
  li input[type=checkbox] {{
    margin-right: 6px;
  }}
  
  .step-header {{
    background: #E8F5E9;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 24px 0 16px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  
  hr {{
    border: none;
    border-top: 2px solid #E8F5E9;
    margin: 32px 0;
  }}
  
  strong {{ color: #1B5E20; }}
  
  .footer {{
    background: #1B5E20;
    color: #C8E6C9;
    padding: 30px 60px;
    text-align: center;
    font-size: 12px;
    margin-top: 40px;
  }}
  
  .footer strong {{ color: white; }}
  
  a {{ color: #2E7D32; }}
</style>
</head>
<body>

<div class="cover">
  <h1>From Idea to MVP<br>in a Weekend</h1>
  <p class="subtitle">The AI-Powered Founder Playbook — GreenSprout Hub</p>
  <span class="badge">🌱 Turn a raw idea into a live website, logo & brand — no code, no agency</span>
</div>

<div class="content">
{html_body}
</div>

<div class="footer">
  <strong>GreenSprout Hub LLC</strong> — Austin, TX<br>
  A founder-led AI lab. We build in public. We ship before we're ready.<br>
  greensprouthub.ai &nbsp;|&nbsp; team@greensprouthub.com
</div>

</body>
</html>
"""

HTML(string=html).write_pdf('/app/lead_magnets/idea_to_mvp_playbook.pdf')
print("PDF created successfully")
