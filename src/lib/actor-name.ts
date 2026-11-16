/**
 * Cross-organization agents are stored with a display suffix. Audit trails use
 * one canonical form so the same shadow is recognizable everywhere.
 */
export function crossOrgActorName(name: string | null | undefined, externalOrgName: string | null | undefined) {
  const raw = (name ?? "").trim();
  const org = (externalOrgName ?? "").trim();
  if (!org) return raw || "Agent";
  const orgPattern = org.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const base = raw
    .replace(/\s*\(via\s+[^)]*\)\s*$/i, "")
    .replace(new RegExp(`\\s*\\(${orgPattern}\\)\\s*$`, "i"), "")
    .trim();
  return `${base || "External agent"} (via ${org})`;
}
