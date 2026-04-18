import { createClientFromRequest } from '@base44/backend';

// ─── Entity list to back up ───────────────────────────────────────────────────
const ENTITIES = [
  'Task',
  'IdeaParkingLot',
  'Deadline',
  'GshIntel',
  'OutreachContact',
  'StrategyDecision',
  'WeeklyOpsReview',
  'HabitLog',
  'Puzzle4LifePiece',
];

// ─── Flatten a record to a row ────────────────────────────────────────────────
function flattenRecord(record: any): string[] {
  return Object.values(record).map((v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}

// ─── Get headers from first record ───────────────────────────────────────────
function getHeaders(record: any): string[] {
  return Object.keys(record);
}

// ─── Sheets API helper ────────────────────────────────────────────────────────
async function sheetsRequest(
  accessToken: string,
  method: string,
  url: string,
  body?: any
) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default async function weeklyDataBackup(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Get Google Sheets token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const date = new Date().toISOString().split('T')[0];
    const spreadsheetTitle = `Yoda Backup — GreenSprout Hub (${date})`;

    // 1. Create a new spreadsheet
    const createRes = await sheetsRequest(
      accessToken,
      'POST',
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        properties: { title: spreadsheetTitle },
        sheets: ENTITIES.map((name) => ({ properties: { title: name } })),
      }
    );

    const spreadsheetId = createRes.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    if (!spreadsheetId) {
      throw new Error(`Failed to create spreadsheet: ${JSON.stringify(createRes)}`);
    }

    const summary: string[] = [];
    let totalRecords = 0;

    // 2. For each entity, fetch all records and write to sheet
    for (const entityName of ENTITIES) {
      try {
        let allRecords: any[] = [];
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
          const result = await base44.asServiceRole.entities[entityName].list({
            limit: 500,
            skip,
          });
          const records = result?.records || result || [];
          allRecords = allRecords.concat(records);
          hasMore = result?.has_more || false;
          skip += 500;
          if (!result?.has_more) break;
        }

        if (allRecords.length === 0) {
          summary.push(`${entityName}: 0 records`);
          continue;
        }

        const headers = getHeaders(allRecords[0]);
        const rows = [headers, ...allRecords.map(flattenRecord)];

        await sheetsRequest(
          accessToken,
          'PUT',
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(entityName)}!A1?valueInputOption=RAW`,
          { values: rows }
        );

        // Bold the header row
        const sheetId = createRes.sheets?.find((s: any) => s.properties.title === entityName)?.properties?.sheetId;
        if (sheetId !== undefined) {
          await sheetsRequest(
            accessToken,
            'POST',
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
              requests: [{
                repeatCell: {
                  range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                  cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 } } },
                  fields: 'userEnteredFormat(textFormat,backgroundColor)',
                },
              }],
            }
          );
        }

        summary.push(`${entityName}: ${allRecords.length} records ✅`);
        totalRecords += allRecords.length;
      } catch (err) {
        summary.push(`${entityName}: ❌ error — ${err}`);
      }
    }

    // 3. Also write a Summary sheet
    const summaryRows = [
      ['Yoda Backup Summary'],
      ['Date', date],
      ['Total Records', String(totalRecords)],
      ['Entities', String(ENTITIES.length)],
      ['Spreadsheet URL', spreadsheetUrl],
      [],
      ['Entity', 'Status'],
      ...summary.map((s) => [s.split(':')[0], s.split(':')[1]?.trim() || '']),
    ];

    await sheetsRequest(
      accessToken,
      'POST',
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        valueInputOption: 'RAW',
        data: [{ range: 'Task!A1', values: summaryRows }],
      }
    );

    // 4. Save backup URL to file for reference
    const backupLog = `/app/gmail/insights/backup_log.json`;
    let existingLog: any[] = [];
    try {
      const f = await Deno.readTextFile(backupLog);
      existingLog = JSON.parse(f);
    } catch {}
    existingLog.push({ date, spreadsheetId, url: spreadsheetUrl, totalRecords, entities: summary });
    await Deno.writeTextFile(backupLog, JSON.stringify(existingLog, null, 2));

    // 5. WhatsApp notification
    const msg = `🗄️ *Weekly Yoda Backup Complete*\n\n` +
      `📅 ${date}\n` +
      `📊 ${totalRecords} total records backed up\n` +
      `🗂️ ${ENTITIES.length} entities exported\n\n` +
      `${summary.join('\n')}\n\n` +
      `🔗 *Spreadsheet:*\n${spreadsheetUrl}`;

    await base44.broadcast({ message: msg, channels: ['whatsapp'] });

    return new Response(JSON.stringify({ success: true, spreadsheetId, spreadsheetUrl, totalRecords, summary }), { status: 200 });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
