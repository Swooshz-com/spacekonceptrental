import "server-only";

import type { ChatProviderResponse } from "./provider";

export const chatbotLaunchBoundaryAllowedPublicPaths = [
  "/",
  "/catalogue",
  "/setups",
  "/about",
  "/quote"
] as const;

export const chatbotLaunchBoundaryFallbackReply =
  "I can help with browsing Home, Catalogue, Setups, About, and Request Quote. For item-specific or event-specific details, please use the Request Quote form so the SKR team can review your enquiry.";

export const chatbotLaunchBoundaryInstructions = [
  "SpaceKonceptRental is a furniture and event rental enquiry/catalogue site.",
  "You are public visitor guidance only. Use approved public site content for Home, Catalogue, Setups, About, and Request Quote.",
  "Help visitors browse the public catalogue and setup presentation, understand how to submit a quote enquiry, and find the Request Quote form.",
  "For item-specific quantities, event-specific details, dates, venues, or fit questions, direct the visitor to Request Quote.",
  "Do not confirm booking or reservation, promise stock or inventory availability, quote final price, take payment, create orders, claim human review, or claim email or n8n delivery succeeded.",
  "Do not expose admin or internal data, provider config, secrets, environment names, webhook URLs, Supabase IDs, storage paths, raw payloads, or unapproved catalogue/setup content.",
  "Never instruct the browser to call n8n directly. The public browser uses only the first-party /api/chat route."
].join("\n");

const unsafeReplyPatterns = [
  /\b(?:cart|checkout|payment|payments|paid|pay now)\b/i,
  /\b(?:order|orders|ordering|purchase|purchases)\b/i,
  /\b(?:booking|booked|reservation|reserved|reserve now)\b/i,
  /\b(?:stock|inventory|in stock|out of stock|available now|guaranteed availability)\b/i,
  /\b(?:fulfilment|fulfillment|customer account|customer accounts)\b/i,
  /\b(?:crm pipeline|sales pipeline)\b/i,
  /\b(?:final price|confirmed price|price is final|quote is final)\b/i,
  /\b(?:human has reviewed|team has reviewed|email (?:was|has been) sent|delivery succeeded)\b/i,
  /\b(?:n8n|webhook|supabase|service role|storage path|storage bucket|raw payload|provider config)\b/i,
  /\b(?:admin route|internal route|\/admin|admin-only)\b/i
];

export function isChatbotLaunchSafeReply(content: string) {
  return !unsafeReplyPatterns.some((pattern) => pattern.test(content));
}

export function applyChatbotLaunchBoundary(
  response: ChatProviderResponse
): ChatProviderResponse {
  if (isChatbotLaunchSafeReply(response.reply.content)) {
    return response;
  }

  return {
    ...response,
    reply: {
      ...response.reply,
      content: chatbotLaunchBoundaryFallbackReply,
      quickReplies: [],
      actions: []
    }
  };
}
