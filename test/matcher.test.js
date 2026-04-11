// test/matcher.test.js
// Run with: node test/matcher.test.js

const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../matcher.js'), 'utf8'));

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ ${description}`);
    failed++;
  }
}

const kws = ['polarity', 'boardy', 'stan.store', 'stanforcreators', 'stan'];

console.log('\n--- textMatches ---');
assert('matches keyword in text', textMatches('check out polarity.cc', kws));
assert('matches keyword case-insensitively', textMatches('I joined POLARITY today', kws));
assert('matches stan.store (special char keyword)', textMatches('stan.store launched', kws));
assert('no match on unrelated text', !textMatches('excited to share some news', kws));
assert('no match on empty text', !textMatches('', kws));
assert('no match with empty keywords', !textMatches('polarity rocks', []));
assert('matches boardy as whole word', textMatches('boardy connected me', kws));
assert('matches stanforcreators', textMatches('@stanforcreators is great', kws));
assert('matches stan as whole word', textMatches('Growth Lead @ Stan', kws));
assert('no match on standup (word boundary)', !textMatches('doing a standup today', kws));
assert('no match on stanford (word boundary)', !textMatches('I go to Stanford', kws));
assert('no match on instagram (word boundary)', !textMatches('follow me on instagram', kws));
assert('matches polarity at end of sentence', textMatches('I just joined Polarity.', kws));
assert('case-insensitive whole word', textMatches('excited to join BOARDY', kws));

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
