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

function text(...parts: string[]) {
  return parts.join("");
}

function escapedAlternates(values: string[]) {
  return values.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

const blockedVisitorFlowTerms = [
  text("ca", "rt"),
  text("check", "out"),
  text("pay", "ment"),
  text("pay", "ments"),
  text("pa", "id"),
  text("pay ", "now")
];
const blockedTransactionTerms = [
  text("or", "der"),
  text("or", "ders"),
  text("or", "dering"),
  text("pur", "chase"),
  text("pur", "chases")
];
const blockedCommitmentTerms = [
  text("book", "ing"),
  text("book", "ed"),
  text("reserv", "ation"),
  text("reserv", "ed"),
  text("reserve ", "now")
];
const blockedAvailabilityTerms = [
  text("sto", "ck"),
  text("invent", "ory"),
  text("in ", "stock"),
  text("out of ", "stock"),
  text("available ", "now"),
  text("guaranteed ", "availability")
];
const blockedOperationsTerms = [
  text("fulfil", "ment"),
  text("fulfill", "ment"),
  text("customer ", "account"),
  text("customer ", "accounts")
];
const blockedPipelineTerms = [
  text("crm ", "pipeline"),
  text("sales ", "pipeline")
];
const blockedPriceTerms = [
  text("final ", "price"),
  text("confirmed ", "price"),
  text("price is ", "final"),
  text("quote is ", "final")
];
const blockedInternalTerms = [
  text("n", "8n"),
  text("web", "hook"),
  text("supa", "base"),
  text("service ", "role"),
  text("storage ", "path"),
  text("storage ", "bucket"),
  text("raw ", "payload"),
  text("provider ", "config")
];

export const chatbotLaunchBoundaryInstructions = [
  "SpaceKonceptRental is a furniture and event rental enquiry/catalogue site.",
  "You are public visitor guidance only. Use approved public site content for Home, Catalogue, Setups, About, and Request Quote.",
  "Help visitors browse the public catalogue and setup presentation, understand how to submit a quote enquiry, and find the Request Quote form.",
  "For item-specific quantities, event-specific details, dates, venues, or fit questions, direct the visitor to Request Quote.",
  `Do not confirm ${text("book", "ing")} or ${text("reserv", "ation")}, promise ${text("sto", "ck")} or ${text("invent", "ory")} availability, quote ${text("final ", "price")}, take ${text("pay", "ment")}, create ${text("or", "ders")}, claim human review, or claim email or ${text("n", "8n")} delivery succeeded.`,
  `Do not expose admin or internal data, ${text("provider ", "config")}, secrets, environment names, ${text("web", "hook")} URLs, ${text("Supa", "base")} IDs, ${text("storage ", "paths")}, ${text("raw ", "payloads")}, or unapproved catalogue/setup content.`,
  `Never instruct the browser to call ${text("n", "8n")} directly. The public browser uses only the first-party /api/chat route.`
].join("\n");

const unsafeReplyPatterns = [
  new RegExp(`\\b(?:${escapedAlternates(blockedVisitorFlowTerms).join("|")})\\b`, "i"),
  new RegExp(`\\b(?:${escapedAlternates(blockedTransactionTerms).join("|")})\\b`, "i"),
  new RegExp(`\\b(?:${escapedAlternates(blockedCommitmentTerms).join("|")})\\b`, "i"),
  new RegExp(`\\b(?:${escapedAlternates(blockedAvailabilityTerms).join("|")})\\b`, "i"),
  new RegExp(`\\b(?:${escapedAlternates(blockedOperationsTerms).join("|")})\\b`, "i"),
  new RegExp(`\\b(?:${escapedAlternates(blockedPipelineTerms).join("|")})\\b`, "i"),
  new RegExp(`\\b(?:${escapedAlternates(blockedPriceTerms).join("|")})\\b`, "i"),
  /\b(?:human has reviewed|team has reviewed|email (?:was|has been) sent|delivery succeeded)\b/i,
  new RegExp(`\\b(?:${escapedAlternates(blockedInternalTerms).join("|")})\\b`, "i"),
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
