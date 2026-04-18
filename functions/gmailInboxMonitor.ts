import { createClientFromRequest } from '@base44/backend';

// ─── Label definitions ───────────────────────────────────────────────────────
const LABEL_DEFINITIONS = [
  'Yoda/Processed',
  'Yoda/🔴 Critical',
  'Yoda/🟡 Important',
  'Yoda/🟢 FYI',
  'Yoda/🛒 Orders & Sales',
  'Yoda/⚠️ Compliance & Deadlines',
  'Yoda/🙋 Customer Inquiry',
  'Yoda/🤝 Partnership & Synergy',
  'Yoda/💡 Idea & Opportunity',
  'Yoda/📈 Trends & Intel',
  'Yoda/📰 Newsletter',
  'Yoda/🌱 Sustainability',
  'Yoda/🏭 Supplier & Ops',
];

// ─── Get or create all labels, return name→id map ────────────────────────────
async function getOrCreateLabels(accessToken: string): Promise<Record<string, string>> {
  const authHeader = { Authorization: `Bearer ${accessToken}` };
  const listRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/labels', { headers: authHeader });
  if (!listRes.ok) return {};
  const listData = await listRes.json();

  const existingMap: Record<string, string> = {};
  for (const l of listData.labels || []) existingMap[l.name] = l.id;

  const result: Record<string, string> = {};
  for (const labelName of LABEL_DEFINITIONS) {
    if (existingMap[labelName]) {
      result[labelName] = existingMap[labelName];
    } else {
      const createRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/labels', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: labelName, labelListVisibility: 'labelShow', messageListVisibility: 'show' }),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        result[labelName] = created.id;
      }
    }
  }
  return result;
}

// ─── Apply labels + optionally archive ───────────────────────────────────────
async function applyLabelsAndArchive(
  accessToken: string,
  messageId: string,
  labelIds: string[],
  archive: boolean
) {
  await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addLabelIds: labelIds,
      removeLabelIds: archive ? ['INBOX'] : [],
    }),
  });
}

// ─── Categorize email ─────────────────────────────────────────────────────────
function categorize(subject: string, from: string, snippet: string) {
  const s = (subject + ' ' + from + ' ' + snippet).toLowerCase();

  type Priority = 'critical' | 'important' | 'fyi' | 'newsletter';
  let priority: Priority = 'fyi';
  const labels: string[] = ['Yoda/Processed'];
  let reason = '';

  // 🔴 CRITICAL
  if (s.includes('order') || s.includes('purchase') || s.includes('invoice') ||
      s.includes('payment received') || s.includes('shipped') ||
      from.toLowerCase().includes('amazon') || from.toLowerCase().includes('etsy') ||
      from.toLowerCase().includes('ebay')) {
    priority = 'critical'; reason = '🛒 Order/Sales';
    labels.push('Yoda/🔴 Critical', 'Yoda/🛒 Orders & Sales');
  }
  if (s.includes('compliance') || s.includes('filing') || s.includes('renewal') ||
      s.includes('overdue') || s.includes('past due') || s.includes('action required') ||
      s.includes('deadline') || s.includes('tax') || s.includes('mercury') ||
      from.toLowerCase().includes('zenbusiness') || from.toLowerCase().includes('irs')) {
    priority = 'critical'; reason = reason || '⚠️ Compliance/Deadline';
    labels.push('Yoda/🔴 Critical', 'Yoda/⚠️ Compliance & Deadlines');
  }

  // 🟡 IMPORTANT
  if (s.includes('inquiry') || s.includes('question about') || s.includes('support') ||
      s.includes('wormspire') || s.includes('puzzle4life') || s.includes('greensprout')) {
    if (priority !== 'critical') { priority = 'important'; reason = reason || '🙋 Customer Inquiry'; }
    labels.push('Yoda/🟡 Important', 'Yoda/🙋 Customer Inquiry');
  }
  if (s.includes('partner') || s.includes('affiliate') || s.includes('collaborate') ||
      s.includes('wholesale') || s.includes('proposal') || s.includes('synerg') ||
      s.includes('sponsor') || s.includes('joint venture')) {
    if (priority !== 'critical') { priority = 'important'; reason = reason || '🤝 Partnership/Synergy'; }
    labels.push('Yoda/🟡 Important', 'Yoda/🤝 Partnership & Synergy');
  }
  if (s.includes('opportunity') || s.includes('launch') || s.includes('grant') ||
      s.includes('funding') || s.includes('incubator') || s.includes('accelerator') ||
      s.includes('pitch') || s.includes('idea')) {
    if (priority !== 'critical') { priority = 'important'; reason = reason || '💡 Idea/Opportunity'; }
    labels.push('Yoda/🟡 Important', 'Yoda/💡 Idea & Opportunity');
  }

  // 📈 TRENDS & INTEL (FYI level)
  if (s.includes('trend') || s.includes('market report') || s.includes('industry') ||
      s.includes('research') || s.includes('study') || s.includes('insight') ||
      s.includes('forecast') || s.includes('data shows')) {
    labels.push('Yoda/📈 Trends & Intel');
  }

  // 🌱 SUSTAINABILITY
  if (s.includes('sustainab') || s.includes('compost') || s.includes('permaculture') ||
      s.includes('climate') || s.includes('green') || s.includes('eco') ||
      s.includes('worm') || s.includes('drawdown') || s.includes('tree')) {
    labels.push('Yoda/🌱 Sustainability');
  }

  // 🏭 SUPPLIER & OPS
  if (s.includes('supplier') || s.includes('inventory') || s.includes('shipment') ||
      s.includes('restock') || s.includes('vendor') || s.includes('manufacturer') ||
      s.includes('quote') || s.includes('fulfillment')) {
    labels.push('Yoda/🏭 Supplier & Ops');
  }

  // 📰 NEWSLETTER (auto-archive, lowest priority)
  const isNewsletter =
    s.includes('unsubscribe') || s.includes('newsletter') || s.includes('digest') ||
    from.toLowerCase().includes('noreply') || from.toLowerCase().includes('no-reply') ||
    from.toLowerCase().includes('mailchimp') || from.toLowerCase().includes('substack') ||
    from.toLowerCase().includes('beehiiv') || from.toLowerCase().includes('convertkit');
  if (isNewsletter && priority === 'fyi') {
    priority = 'newsletter';
    labels.push('Yoda/📰 Newsletter');
  }

  // Priority label
  if (priority === 'fyi' && !isNewsletter) labels.push('Yoda/🟢 FYI');

  return {
    priority,
    reason,
    labels: [...new Set(labels)],
    archive: priority !== 'critical', // Critical stays in inbox, everything else archived
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function gmailInboxMonitor(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const messageIds = body.data?.new_message_ids ?? [];

    if (!messageIds.length) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };
    const labelMap = await getOrCreateLabels(accessToken);

    const alerts: any[] = [];

    for (const messageId of messageIds) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          { headers: authHeader }
        );
        if (!res.ok) continue;
        const message = await res.json();

        const headers: Record<string, string> = {};
        for (const h of message.payload?.headers || []) headers[h.name] = h.value;

        const subject = headers.Subject || 'No Subject';
        const from = headers.From || 'Unknown';
        const snippet = message.snippet || '';
        const rawDate = headers.Date || '';
        const date = rawDate
          ? new Date(rawDate).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true,
              timeZone: 'America/Chicago',
            })
          : 'Unknown date';

        const cat = categorize(subject, from, snippet);
        const labelIds = cat.labels.map(n => labelMap[n]).filter(Boolean);
        await applyLabelsAndArchive(accessToken, messageId, labelIds, cat.archive);

        if (cat.priority === 'critical' || cat.priority === 'important') {
          alerts.push({ subject, from, snippet: snippet.substring(0, 120), date, messageId, ...cat });
        }
      } catch (e) {
        console.error(`Error processing ${messageId}:`, e);
      }
    }

    // WhatsApp alert for critical + important only
    if (alerts.length > 0) {
      let msg = '📧 *New Email Alert(s)*\n\n';
      for (const a of alerts) {
        const icon = a.priority === 'critical' ? '🔴' : '🟡';
        msg += `${icon} *${a.priority.toUpperCase()}* — ${a.reason}\n`;
        msg += `📅 ${a.date}\n`;
        msg += `👤 ${a.from}\n`;
        msg += `📌 ${a.subject}\n`;
        msg += `💬 ${a.snippet}...\n`;
        msg += `🔗 https://mail.google.com/mail/u/0/#all/${a.messageId}\n`;
        msg += `🏷️ ${a.labels.filter((l: string) => l !== 'Yoda/Processed').join(', ')}\n\n`;
      }
      msg += `_✅ ${messageIds.length} email(s) labeled & filed_\n`;
      msg += `🗂️ https://yoda.base44.app`;
      await base44.broadcast({ message: msg, channels: ['whatsapp'] });
    }

    return new Response(JSON.stringify({ processed: messageIds.length, alerted: alerts.length }), { status: 200 });
  } catch (error) {
    console.error('Gmail monitor error:', error);
    return new Response(JSON.stringify({ error: 'Processing failed' }), { status: 500 });
  }
}
