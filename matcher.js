// matcher.js
// Generic keyword matching — no hardcoded terms.

function textMatches(text, keywords) {
  if (!text || !keywords.length) return false;
  return keywords.some((kw) => {
    // Pure word chars (letters/digits only): use word boundaries so "stan" doesn't match "standup"
    if (/^\w+$/.test(kw)) {
      return new RegExp('\\b' + kw + '\\b', 'i').test(text);
    }
    // Keywords with dots, spaces, etc. are specific enough — substring match
    return text.toLowerCase().includes(kw);
  });
}
