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
