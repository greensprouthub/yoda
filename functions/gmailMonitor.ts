import { createClientFromRequest } from "@base44/sdk/edge";

const URGENT_KEYWORDS = [
  "order",
  "payment",
  "invoice",
  "urgent",
  "asap",
  "emergency",
  "compliance",
  "zenbusiness",
  "verify",
  "confirm",
  "action required",
  "deadline",
  "overdue",
];

const SENDER_PRIORITY: Record<string, string> = {
  "amazon": "high",
  "etsy": "high",
  "ebay": "high",
  "wormspire": "high",
  "puzzle4life": "high",
  "zenbusiness": "critical",
  "irs": "critical",
  "stripe": "high",
  "paypal": "high",
};

export default async function handler(req: Request) {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  // Extract new message IDs from the webhook payload
  const messageIds = body.data?.new_message_ids ?? [];

  if (!messageIds.length) {
    return new Response(JSON.stringify({ status: "no_new_messages" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get Gmail access token
  let accessToken: string;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection("gmail");
    accessToken = conn.accessToken;
  } catch (error) {
    console.error("Failed to get Gmail token:", error);
    return new Response(JSON.stringify({ error: "Auth failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Process each new message
  for (const messageId of messageIds) {
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );

      if (!res.ok) {
        console.error(`Failed to fetch message ${messageId}: ${res.status}`);
        continue;
      }

      const message = await res.json();
      const headers = message.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "(no subject)";
      const from = headers.find((h: any) => h.name === "From")?.value || "unknown";
      const snippet = message.snippet || "";

      // Determine priority
      let priority = "low";
      const lowerText = `${subject} ${from} ${snippet}`.toLowerCase();

      // Check sender priority
      for (const [domain, level] of Object.entries(SENDER_PRIORITY)) {
        if (lowerText.includes(domain)) {
          priority = level;
          break;
        }
      }

      // Check keywords if not already critical/high
      if (priority === "low") {
        for (const keyword of URGENT_KEYWORDS) {
          if (lowerText.includes(keyword)) {
            priority = "high";
            break;
          }
        }
      }

      // Only alert on high/critical priority
      if (priority === "high" || priority === "critical") {
        const alertMessage =
          priority === "critical"
            ? `🚨 URGENT EMAIL\n\nFrom: ${from}\nSubject: ${subject}\n\n${snippet.substring(0, 100)}...`
            : `📧 Important Email\n\nFrom: ${from}\nSubject: ${subject}\n\n${snippet.substring(0, 100)}...`;

        await base44.broadcast({
          message: alertMessage,
          channels: ["whatsapp"],
        });
      }

      console.log(`Processed ${messageId}: ${subject} (priority: ${priority})`);
    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);
    }
  }

  return new Response(JSON.stringify({ status: "success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
