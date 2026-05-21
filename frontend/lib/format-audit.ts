/** Human-readable audit log fields (details may be JSON from the API). */

const DETAIL_MESSAGE_ALIASES: Record<string, string> = {
  "Demo dataset initialized": "Sample transaction data initialized",
};

export function formatAuditAction(action: string): string {
  if (action === "dataset_seed" || action === "demo_seed") return "Data refresh";
  const normalized = action.replace(/_/g, " ").trim();
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditDetails(details: string): string {
  if (!details?.trim()) return "—";

  try {
    const parsed = JSON.parse(details) as { message?: string };
    if (typeof parsed.message === "string") {
      return DETAIL_MESSAGE_ALIASES[parsed.message] ?? parsed.message;
    }
  } catch {
    /* plain text */
  }

  return DETAIL_MESSAGE_ALIASES[details] ?? details;
}
