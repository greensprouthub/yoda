import { Hono } from "hono";
import { createClientFromRequest } from "@base44/functions";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();
  const base44 = createClientFromRequest(c.req);

  const messageIds = body.data?.new_message_ids ?? [];
  if (!messageIds.length) {
    return c.json({ status: "no_messages" });
  }

  const { accessToken } = await base44.asServiceRole.connectors.getConnection(
    "gmail"
  );
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  for (const messageId of messageIds) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );

      if (!res.ok) continue;

      const message = await res.json();
      const headers = message.payload?.headers || [];
      const from = headers.find((h: any) => h.name === "From")?.value || "";
      const subject =
        headers.find((h: any) => h.name === "Subject")?.value || "(no subject)";
      const snippet = message.snippet || "";

      // Parse body
      let bodyText = snippet;
      if (message.payload?.parts) {
        const textPart = message.payload.parts.find(
          (p: any) => p.mimeType === "text/plain"
        );
        if (textPart?.body?.data) {
          bodyText = Buffer.from(textPart.body.data, "base64").toString();
        }
      } else if (message.payload?.body?.data) {
        bodyText = Buffer.from(message.payload.body.data, "base64").toString();
      }

      // Categorize email
      let urgency = "normal";
      let category = "other";

      const lowerSubject = subject.toLowerCase();
      const lowerBody = bodyText.toLowerCase();
      const lowerFrom = from.toLowerCase();

      // Check for order confirmations
      if (
        lowerSubject.includes("order") ||
        lowerSubject.includes("amazon") ||
        lowerSubject.includes("etsy") ||
        lowerSubject.includes("shipment")
      ) {
        category = "wormspire_order";
        urgency = "high";
      }

      // Check for compliance/ZenBusiness
      if (
        lowerSubject.includes("zenbusiness") ||
        lowerSubject.includes("compliance") ||
        lowerSubject.includes("filing") ||
        lowerSubject.includes("tax") ||
        lowerSubject.includes("annual")
      ) {
        category = "compliance";
        urgency = "high";
      }

      // Check for customer inquiries
      if (
        lowerSubject.includes("inquiry") ||
        lowerSubject.includes("question") ||
        lowerSubject.includes("interested")
      ) {
        category = "customer_inquiry";
        urgency = "high";
      }

      // Check for urgent keywords
      if (
        lowerSubject.includes("urgent") ||
        lowerSubject.includes("asap") ||
        lowerSubject.includes("important") ||
        lowerSubject.includes("overdue")
      ) {
        urgency = "urgent";
      }

      // If urgent or important category, alert user
      if (urgency === "high" || urgency === "urgent") {
        const alert =
          urgency === "urgent"
            ? `⚠️ URGENT EMAIL: ${subject}\n\nFrom: ${from}\n\nPreview: ${bodyText.substring(0, 150)}...`
            : `📧 IMPORTANT: ${subject}\n\nFrom: ${from}\n\nCategory: ${category}`;

        await base44.messaging.broadcast({
          message: alert,
          channels: ["whatsapp"],
        });
      }
    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);
    }
  }

  return c.json({ status: "processed", count: messageIds.length });
});

export default app;
