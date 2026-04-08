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

// LinkedIn-specific: scan entire post text. "polarity" and "boardy" are
// company-specific enough on LinkedIn; "stan" stays excluded (Stanford, etc.).
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

function linkedinMatches(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return LINKEDIN_KEYWORDS.some((kw) => lower.includes(kw));
}
