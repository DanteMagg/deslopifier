// test/matcher.test.js
// Run with: node test/matcher.test.js

// matcher.js uses module.exports when running in Node, but is a plain script in Chrome.
// We load it by reading and eval-ing it to avoid ES module/CJS friction.
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

console.log('\n--- bodyMatches ---');
assert('matches stanforcreators', bodyMatches('@stanforcreators great post'));
assert('matches stan_store', bodyMatches('check out @stan_store'));
assert('matches boardy_ai', bodyMatches('loving @boardy_ai'));
assert('matches boardyai', bodyMatches('try @boardyai'));
assert('matches polarityco', bodyMatches('@polarityco is wild'));
assert('matches stan.store', bodyMatches('stan.store is cool'));
assert('matches boardy.ai', bodyMatches('boardy.ai rocks'));
assert('matches polarity.cc', bodyMatches('polarity.cc launched'));
assert('no false positive on "polarity"', !bodyMatches('magnetic polarity reversed'));
assert('no false positive on "stan"', !bodyMatches('I stan this band'));
assert('no false positive on "boardy"', !bodyMatches('the boardy wooden thing'));
assert('case-insensitive stanforcreators', bodyMatches('@StanForCreators'));
assert('case-insensitive polarityco', bodyMatches('@PolarityCo'));

console.log('\n--- authorMatches ---');
assert('matches "stan" in author', authorMatches('Stan Store'));
assert('matches "boardy" in author', authorMatches('Boardy AI'));
assert('matches "polarity" in author', authorMatches('Polarity HQ'));
assert('matches "at stan" in job title', authorMatches('Engineer at Stan'));
assert('matches "at boardy" in job title', authorMatches('Founder at Boardy'));
assert('matches "at polarity" in job title', authorMatches('Designer at Polarity'));
assert('case-insensitive author match', authorMatches('BOARDY'));
assert('no match on unrelated author', !authorMatches('John Smith'));
assert('no match on unrelated job', !authorMatches('Engineer at Google'));

console.log('\n--- linkedinMatches ---');
assert('matches "polarity" in post text', linkedinMatches('I just joined Polarity Fellowship'));
assert('matches "boardy" in post text', linkedinMatches('Boardy connected me with 3 investors'));
assert('matches stanforcreators in linkedin', linkedinMatches('check stanforcreators out'));
assert('matches stan.store in linkedin', linkedinMatches('stan.store launched'));
assert('matches boardy.ai in linkedin', linkedinMatches('boardy.ai is wild'));
assert('matches polarity.cc in linkedin', linkedinMatches('polarity.cc fellowship'));
assert('no match on "stanford"', !linkedinMatches('I go to Stanford University'));
assert('no match on unrelated text', !linkedinMatches('excited to share some news'));
assert('case-insensitive polarity', linkedinMatches('Growth Fellow @ POLARITY'));
assert('matches job title "at Polarity"', linkedinMatches('Founding Engineer at Polarity'));

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
