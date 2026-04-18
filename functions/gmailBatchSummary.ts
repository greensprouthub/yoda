import { createClientFromRequest } from '@base44/backend';

// ─── Archive-first inbox processing ──────────────────────────────────────────
// Rule: Only these stay in inbox. Everything else is labeled + archived.
// KEEP: real orders, payment/banking alerts, compliance deadlines,
//       customer inquiries about GSH products, direct seller actions (ship now, action required)
// ARCHIVE: newsletters, promos, social, meetups, FYI intel, marketing

const LABEL_IDS: Record<string, string> = {
  processed:    'Label_3',
  critical:     'Label_4',
  important:    'Label_5',
  fyi:          'Label_6',
  orders:       'Label_7',
  compliance:   'Label_8',
  inquiry:      'Label_9',
  partnership:  'Label_10',
  idea:         'Label_11',
  trends:       'Label_12',
  newsletter:   'Label_13',
  sustainability:'Label_14',
  supplier:     'Label_15',
};

// Senders that are ALWAYS archived no matter what
const ALWAYS_ARCHIVE_SENDERS = [
  'tldrnewsletter.com', 'milliondollarcoach', 'forgoodprofits', 'mindvalley',
  'kickstartech', 'trudeautraining', 'theshellworks', 'coworkies',
  'aicollective', 'taxact', 'mail.adobe.com', 'brevo', 'trends-noreply',
  'joinhampton', 'relatef', 'groupupdates@facebookmail', 'nextdoor',
  'do512', 'austinparks', 'contracommon', 'vinhgiang', 'centraltexasmycology',
  'communityimpact', 'rs.email.nextdoor', 'scorevolunteer',
  // AWS/Amazon marketing (NOT seller-central)
  'aws-marketing-email', 'business.amazo',
  // Generic newsletter platforms
  'mailchimp', 'substack', 'beehiiv', 'convertkit', 'constantcontact',
];

const ALWAYS_ARCHIVE_SUBJECT_KEYWORDS = [
  'coachella', 'salesless in 24', 'loving taxes', 'drinks on james',
  '3000 steps in a zoom', 'kevin\'s gift deadline', 'big spring sale',
  'goalker h3 pro', 'record store day', '420 events',
];

function categorize(subject: string, from: string, snippet: string): {
  labels: string[];
  archive: boolean;
  tier: 'critical' | 'important' | 'fyi' | 'newsletter';
  reason: string;
} {
  const s = (subject + ' ' + from + ' ' + snippet).toLowerCase();
  const f = from.toLowerCase();

  // Always archive — check first
  const alwaysArchive =
    ALWAYS_ARCHIVE_SENDERS.some(x => f.includes(x)) ||
    ALWAYS_ARCHIVE_SUBJECT_KEYWORDS.some(x => s.includes(x)) ||
    s.includes('unsubscribe') && !s.includes('amazon') && !s.includes('etsy') && !s.includes('ebay');

  if (alwaysArchive) {
    return { labels: [LABEL_IDS.processed, LABEL_IDS.newsletter], archive: true, tier: 'newsletter', reason: 'Newsletter/Promo' };
  }

  const labels: Set<string> = new Set([LABEL_IDS.processed]);

  // ── CRITICAL (stays in inbox) ────────────────────────────────────────────
  let tier: 'critical' | 'important' | 'fyi' | 'newsletter' = 'fyi';
  let reason = '';

  // Real orders — eBay/Amazon/Etsy SELL notifications
  if (s.includes('sold, ship now') || s.includes('ship now:') ||
      s.includes('you made the sale') || s.includes('order confirmed') ||
      s.includes('order received') || s.includes('we got your order') ||
      (s.includes('order') && (f.includes('seller-notification') || f.includes('etsy') || f.includes('ebay')))) {
    tier = 'critical'; reason = '🛒 New Order';
    labels.add(LABEL_IDS.critical); labels.add(LABEL_IDS.orders);
  }

  // Payment / banking
  if (f.includes('mercury') || f.includes('stripe') || f.includes('shopify billing') ||
      f.includes('affirm-billing') || f.includes('clicklease') ||
      s.includes('ach') || s.includes('payment due') || s.includes('outstanding fees') ||
      s.includes('credit card update') || s.includes('flagged ach') ||
      s.includes('charged your') || s.includes('receipt from') ||
      s.includes('your account needs attention') || s.includes('credit may be impacted')) {
    tier = 'critical'; reason = reason || '💳 Payment/Banking';
    labels.add(LABEL_IDS.critical); labels.add(LABEL_IDS.compliance);
  }

  // Compliance / deadlines / legal
  if (f.includes('irs') || f.includes('cpa.texas.gov') || f.includes('zenbusiness') ||
      f.includes('texasagriculture') || s.includes('tax return due') ||
      s.includes('action required') || s.includes('deadline') ||
      s.includes('1099') || s.includes('past due') || s.includes('overdue') ||
      s.includes('authorize your domain') || s.includes('update your bank information')) {
    tier = 'critical'; reason = reason || '⚠️ Compliance/Deadline';
    labels.add(LABEL_IDS.critical); labels.add(LABEL_IDS.compliance);
  }

  // Amazon/eBay seller action items
  if ((f.includes('amazon') || f.includes('ebay')) &&
      (s.includes('action required') || s.includes('action needed') ||
       s.includes('removed your listing') || s.includes('pay your seller') ||
       s.includes('update') || s.includes('remember to ship') ||
       s.includes('free tier expires'))) {
    tier = 'critical'; reason = reason || '🔴 Seller Action Required';
    labels.add(LABEL_IDS.critical); labels.add(LABEL_IDS.orders);
  }

  // GSH product inquiries (real customers)
  if ((s.includes('wormspire') || s.includes('puzzle4life') || s.includes('greensprout')) &&
      (s.includes('question') || s.includes('inquiry') || s.includes('help') || s.includes('order'))) {
    if (tier !== 'critical') { tier = 'critical'; reason = '🙋 Customer Inquiry'; }
    labels.add(LABEL_IDS.critical); labels.add(LABEL_IDS.inquiry);
  }

  // ── IMPORTANT (stays in inbox) ───────────────────────────────────────────
  if (tier === 'fyi') {
    if (s.includes('partner') || s.includes('collaborate') || s.includes('wholesale') ||
        s.includes('sponsor') || s.includes('synerg') || s.includes('xToolSquad') ||
        f.includes('xtoolsquad') || f.includes('customthings')) {
      tier = 'important'; reason = '🤝 Partnership';
      labels.add(LABEL_IDS.important); labels.add(LABEL_IDS.partnership);
    }
    if (s.includes('grant') || s.includes('funding') || s.includes('accelerator') ||
        s.includes('incubator') || s.includes('pitch') || s.includes('preorder')) {
      tier = 'important'; reason = reason || '💡 Opportunity';
      labels.add(LABEL_IDS.important); labels.add(LABEL_IDS.idea);
    }
  }

  // ── FYI tags (archived but labeled) ─────────────────────────────────────
  if (s.includes('sustainab') || s.includes('compost') || s.includes('worm') ||
      s.includes('tree') || s.includes('eco') || s.includes('permaculture')) {
    labels.add(LABEL_IDS.sustainability);
  }
  if (s.includes('supplier') || s.includes('inventory') || s.includes('vendor') ||
      s.includes('shipment') || s.includes('fulfillment')) {
    labels.add(LABEL_IDS.supplier);
  }

  // Newsletters / meetups / updates — archive
  const isNewsletter =
    f.includes('noreply') || f.includes('no-reply') || f.includes('newsletter') ||
    f.includes('meetup') || f.includes('kickstarter') || f.includes('luma-mail') ||
    f.includes('redditmail') || f.includes('facebookmail') || f.includes('f.email') ||
    f.includes('hover') || f.includes('google search console') || f.includes('sc-noreply') ||
    s.includes('this week in your shop') || s.includes('personalized shop tips') ||
    s.includes('what buyers are searching') || s.includes('seller news:') ||
    s.includes('listing performance') || s.includes('weekly listing');

  if (isNewsletter && tier === 'fyi') {
    tier = 'newsletter';
    labels.add(LABEL_IDS.newsletter);
  } else if (tier === 'fyi') {
    labels.add(LABEL_IDS.fyi);
  }

  const archive = tier === 'newsletter' || tier === 'fyi';

  return { labels: [...labels], archive, tier, reason };
}

export default async function gmailBatchSummary(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Fetch inbox messages
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=50',
      { headers: auth }
    );
    const listData = await listRes.json();
    const messages = listData.messages || [];

    if (!messages.length) {
      return new Response(JSON.stringify({ processed: 0, message: 'Inbox clean' }), { status: 200 });
    }

    const critical: string[] = [];
    const important: string[] = [];
    let archived = 0;

    for (const { id } of messages) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          { headers: auth }
        );
        const msg = await msgRes.json();
        const headers: Record<string, string> = {};
        for (const h of msg.payload?.headers || []) headers[h.name] = h.value;

        const subject = headers.Subject || '';
        const from = headers.From || '';
        const snippet = msg.snippet || '';

        const cat = categorize(subject, from, snippet);

        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addLabelIds: cat.labels,
            removeLabelIds: cat.archive ? ['INBOX'] : [],
          }),
        });

        if (cat.archive) {
          archived++;
        } else if (cat.tier === 'critical') {
          critical.push(`🔴 ${cat.reason}\n   ${subject.substring(0, 60)}\n   ${from.substring(0, 50)}`);
        } else if (cat.tier === 'important') {
          important.push(`🟡 ${cat.reason}\n   ${subject.substring(0, 60)}\n   ${from.substring(0, 50)}`);
        }
      } catch (e) {
        console.error(`Error processing message ${id}:`, e);
      }
    }

    // Only send WhatsApp if there's something worth reporting
    const hasAlerts = critical.length > 0 || important.length > 0;
    if (hasAlerts) {
      let msg = `📧 *Email Digest*\n\n`;
      if (critical.length) {
        msg += `*🔴 NEEDS YOUR ATTENTION (${critical.length})*\n`;
        msg += critical.slice(0, 5).join('\n\n') + '\n\n';
      }
      if (important.length) {
        msg += `*🟡 WORTH KNOWING (${important.length})*\n`;
        msg += important.slice(0, 3).join('\n\n') + '\n\n';
      }
      msg += `_✅ ${archived} emails archived, inbox kept clean_`;
      await base44.broadcast({ message: msg, channels: ['whatsapp'] });
    }

    return new Response(JSON.stringify({
      processed: messages.length,
      archived,
      critical: critical.length,
      important: important.length,
    }), { status: 200 });

  } catch (error) {
    console.error('Gmail batch error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
