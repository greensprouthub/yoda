import { createClientFromRequest } from "@base44/sdk";

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: Array<any>;
    body?: { data?: string };
  };
}

interface EmailData {
  from: string;
  to: string;
  subject: string;
  snippet: string;
  messageId: string;
  isUrgent: boolean;
  category: string;
}

function extractEmailField(headers: any[], fieldName: string): string {
  const header = headers?.find((h) => h.name === fieldName);
  return header?.value || "";
}

function categorizeEmail(subject: string, from: string, body: string): string {
  const lower = (subject + " " + from + " " + body).toLowerCase();

  if (
    lower.includes("amazon") ||
    lower.includes("ebay") ||
    lower.includes("etsy") ||
    lower.includes("order")
  ) {
    return "Wormspire Order";
  }
  if (lower.includes("zenbusiness") || lower.includes("compliance")) {
    return "Compliance/ZenBusiness";
  }
  if (lower.includes("affiliate") || lower.includes("partnership")) {
    return "Partnership/Affiliate";
  }
  if (lower.includes("customer") || lower.includes("support")) {
    return "Customer Inquiry";
  }
  return "Other";
}

function isUrgent(subject: string, category: string): boolean {
  return (
    category === "Wormspire Order" ||
    category === "Compliance/ZenBusiness" ||
    subject.toLowerCase().includes("urgent") ||
    subject.toLowerCase().includes("action required")
  );
}

export default async function handler(req: any) {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json();
    const messageIds = body.data?.new_message_ids ?? [];

    if (!messageIds.length) {
      return { ok: true, message: "No new messages" };
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection(
      "gmail"
    );
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const emailsToProcess: EmailData[] = [];

    for (const messageId of messageIds) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          { headers: authHeader }
        );

        if (!res.ok) {
          console.error(`Failed to fetch message ${messageId}:`, res.status);
          continue;
        }

        const message: GmailMessage = await res.json();
        const headers = message.payload?.headers || [];

        const from = extractEmailField(headers, "From");
        const to = extractEmailField(headers, "To");
        const subject = extractEmailField(headers, "Subject");
        const snippet = message.snippet || "";

        // Extract body for categorization
        let bodyText = "";
        if (message.payload?.body?.data) {
          bodyText = Buffer.from(message.payload.body.data, "base64").toString(
            "utf-8"
          );
        }

        const category = categorizeEmail(subject, from, bodyText);
        const urgent = isUrgent(subject, category);

        emailsToProcess.push({
          from,
          to,
          subject,
          snippet,
          messageId,
          isUrgent: urgent,
          category,
        });
      } catch (err) {
        console.error(`Error processing message ${messageId}:`, err);
      }
    }

    // Send WhatsApp alerts for urgent emails
    if (emailsToProcess.length > 0) {
      const urgentEmails = emailsToProcess.filter((e) => e.isUrgent);

      if (urgentEmails.length > 0) {
        let alertMessage = "🔴 Urgent emails arrived:\n\n";

        for (const email of urgentEmails) {
          alertMessage += `📧 ${email.category}\n`;
          alertMessage += `From: ${email.from}\n`;
          alertMessage += `Subject: ${email.subject}\n`;
          alertMessage += `Preview: ${email.snippet.substring(0, 80)}...\n\n`;
        }

        alertMessage +=
          "Check Gmail or reply here for me to draft a response.";

        // Send via broadcast (goes to all channels including WhatsApp)
        await base44.broadcast({
          message: alertMessage,
          channels: ["whatsapp"],
        });
      }
    }

    return { ok: true, processed: emailsToProcess.length };
  } catch (err) {
    console.error("Gmail handler error:", err);
    return { ok: false, error: String(err) };
  }
}
