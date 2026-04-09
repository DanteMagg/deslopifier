// matcher.js
// Pure matching functions — no DOM access, no Chrome APIs.

const BODY_KEYWORDS = [
  'stanforcreators',
  'stan_store',
  'stan.store',
  'boardy_ai',
  'boardyai',
  'boardy.ai',
  'polarity.cc',
  'polarityco',
];

const AUTHOR_KEYWORDS = ['stan', 'boardy', 'polarity'];

// LinkedIn-specific: scan entire post text.
const LINKEDIN_KEYWORDS = [
  'polarity',
  'boardy',
  'stanforcreators',
  'stan_store',
  'stan.store',
  'boardy_ai',
  'boardyai',
  'boardy.ai',
  'polarity.cc',
  'polarityco',
  'stan store',   // "Stan Store" as company name
  // '@ stan' handled by regex below — needs word boundary to avoid "@ Stanford"
  'at stan ',     // "at Stan " in job title (trailing space avoids "at Stanford")
  'join stan',
  'joined stan',
  'joining stan',
];

function bodyMatches(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BODY_KEYWORDS.some((kw) => lower.includes(kw));
}

function authorMatches(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return AUTHOR_KEYWORDS.some((kw) => lower.includes(kw));
}

// Matches "@ Stan" or "@ Stan·" or "@ Stan " but not "@ Stanford"
const AT_STAN_RE = /@ ?stan(?:[^a-z]|$)/i;

function linkedinMatches(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return LINKEDIN_KEYWORDS.some((kw) => lower.includes(kw)) || AT_STAN_RE.test(text);
}
