import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LABEL_DEFS = [
  'Yoda/Processed', 'Yoda/🔴 Critical', 'Yoda/🟡 Important', 'Yoda/🟢 FYI',
  'Yoda/🛒 Orders & Sales', 'Yoda/⚠️ Compliance & Deadlines', 'Yoda/🙋 Customer Inquiry',
  'Yoda/🤝 Partnership & Synergy', 'Yoda/💡 Idea & Opportunity', 'Yoda/📈 Trends & Intel',
  'Yoda/📰 Newsletter', 'Yoda/🌱 Sustainability', 'Yoda/🏭 Supplier & Ops',
];

function categorize(subject: string, from_: string, snippet: string) {
  const s = (subject + ' ' + from_ + ' ' + snippet).toLowerCase();
  const f = from_.toLowerCase();
  let priority = 'fyi';
  const labels = ['Yoda/Processed'];

  if (['order','purchase','invoice','payment received','shipped','your order'].some(x => s.includes(x)) ||
      ['amazon','etsy','ebay','marketplace'].some(x => f.includes(x))) {
    priority = 'critical'; labels.push('Yoda/🔴 Critical', 'Yoda/🛒 Orders & Sales');
  }
  if (['compliance','filing','renewal','overdue','past due','action required','deadline','tax','mercury bank','payment failed','suspended','account on hold'].some(x => s.includes(x)) ||
      ['zenbusiness','irs.gov','mercury'].some(x => f.includes(x))) {
    priority = 'critical'; labels.push('Yoda/🔴 Critical', 'Yoda/⚠️ Compliance & Deadlines');
  }
  if (['inquiry','question about','wormspire','puzzle4life','greensprout','your product'].some(x => s.includes(x))) {
    if (priority !== 'critical') priority = 'important';
    labels.push('Yoda/🟡 Important', 'Yoda/🙋 Customer Inquiry');
  }
  if (['partner','affiliate','collaborat','wholesale','sponsor','joint venture','proposal'].some(x => s.includes(x))) {
    if (priority !== 'critical') priority = 'important';
    labels.push('Yoda/🟡 Important', 'Yoda/🤝 Partnership & Synergy');
  }
  if (['opportunity','grant','funding','incubator','accelerator','pitch'].some(x => s.includes(x))) {
    if (priority !== 'critical') priority = 'important';
    labels.push('Yoda/🟡 Important', 'Yoda/💡 Idea & Opportunity');
  }
  if (['trend','market report','research','insight','forecast','industry report'].some(x => s.includes(x)))
    labels.push('Yoda/📈 Trends & Intel');
  if (['sustainab','compost','permaculture','climate','eco','worm','drawdown','tree','garden'].some(x => s.includes(x)))
    labels.push('Yoda/🌱 Sustainability');
  if (['supplier','inventory','shipment','restock','vendor','manufacturer','fulfillment'].some(x => s.includes(x)))
    labels.push('Yoda/🏭 Supplier & Ops');

  const isNewsletter = ['unsubscribe','newsletter','digest','weekly update','daily update'].some(x => s.includes(x)) ||
    ['noreply','no-reply','mailchimp','substack','beehiiv','convertkit','sendgrid','klaviyo'].some(x => f.includes(x));
  if (isNewsletter && priority === 'fyi') {
    priority = 'newsletter'; labels.push('Yoda/📰 Newsletter');
  }
  if (priority === 'fyi' && !isNewsletter) labels.push('Yoda/🟢 FYI');

  return { labels: [...new Set(labels)], archive: priority !== 'critical', priority };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const offset = body.offset ?? 0;
    const batchSize = body.batch_size ?? 100;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const auth = `Bearer ${accessToken}`;

    // Ensure labels exist
    const labelsRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/labels',
      { headers: { Authorization: auth } });
    const labelsData = await labelsRes.json();
    const existingLabels: Record<string, string> = {};
    for (const l of labelsData.labels ?? []) existingLabels[l.name] = l.id;

    const labelMap: Record<string, string> = {};
    for (const name of LABEL_DEFS) {
      if (existingLabels[name]) {
        labelMap[name] = existingLabels[name];
      } else {
        const r = await fetch('https://www.googleapis.com/gmail/v1/users/me/labels', {
          method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, labelListVisibility: 'labelShow', messageListVisibility: 'show' })
        });
        const created = await r.json();
        labelMap[name] = created.id;
      }
    }

    // Fetch inbox IDs for this batch
    let allIds: string[] = [];
    let pageToken: string | null = null;
    let page = 0;
    const neededPages = Math.ceil((offset + batchSize) / 500);

    while (page < neededPages) {
      const url = `https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=500${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const r = await fetch(url, { headers: { Authorization: auth } });
      const d = await r.json();
      allIds = allIds.concat((d.messages ?? []).map((m: any) => m.id));
      pageToken = d.nextPageToken ?? null;
      page++;
      if (!pageToken) break;
    }

    const totalInbox = allIds.length + (pageToken ? 999 : 0); // estimate
    const batch = allIds.slice(offset, offset + batchSize);

    const stats = { critical: 0, important: 0, newsletter: 0, fyi: 0, errors: 0 };
    const criticalItems: any[] = [];

    for (const mid of batch) {
      try {
        const msgRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${mid}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          { headers: { Authorization: auth } }
        );
        const msg = await msgRes.json();
        const hdrs: Record<string, string> = {};
        for (const h of msg.payload?.headers ?? []) hdrs[h.name] = h.value;

        const subject = hdrs['Subject'] ?? '';
        const from_ = hdrs['From'] ?? '';
        const snippet = (msg.snippet ?? '').slice(0, 150);

        const { labels: labelNames, archive, priority } = categorize(subject, from_, snippet);
        const labelIds = labelNames.map((n: string) => labelMap[n]).filter(Boolean);

        await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${mid}/modify`, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ addLabelIds: labelIds, removeLabelIds: archive ? ['INBOX'] : [] })
        });

        if (priority in stats) (stats as any)[priority]++;
        else stats.fyi++;

        if (priority === 'critical') criticalItems.push({ subject, from: from_, id: mid });
      } catch {
        stats.errors++;
      }
    }

    const hasMore = offset + batchSize < allIds.length;

    return Response.json({
      ok: true,
      processed: batch.length,
      offset,
      next_offset: offset + batchSize,
      has_more: hasMore,
      total_fetched: allIds.length,
      stats,
      critical_items: criticalItems
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
