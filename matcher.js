// matcher.js
// Generic keyword matching — no hardcoded terms.

function textMatches(text, keywords) {
  if (!text || !keywords.length) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}
