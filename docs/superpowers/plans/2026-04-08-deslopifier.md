# Deslopifier Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Manifest V3 Chrome extension that hides Twitter/X and LinkedIn posts from or mentioning Stan/Stanley, Boardy, or Polarity.

**Architecture:** A single content script injected into Twitter/X and LinkedIn uses a MutationObserver to catch posts as they load, checks author and body text against keyword lists, and sets `display:none` on matches. A popup provides an on/off toggle and hidden-post counter backed by `chrome.storage`.

**Tech Stack:** Vanilla JS, Manifest V3, chrome.storage.sync/session, MutationObserver

---

## File Map

| File | Responsibility |
|---|---|
| `manifest.json` | MV3 manifest — permissions, content script declarations, popup |
| `matcher.js` | Pure matching functions — no DOM, no Chrome APIs, fully testable |
| `content.js` | DOM scanning, MutationObserver, message listener, imports matcher logic |
| `popup.html` | Toggle + counter UI |
| `popup.js` | Reads/writes chrome.storage, sends toggle message to content script |
| `test/matcher.test.js` | Node.js unit tests for matcher.js |

---

## Task 1: Project scaffold + manifest.json

**Files:**
- Create: `manifest.json`
- Create: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` (placeholder PNGs)

- [ ] **Step 1: Create placeholder icons**

```bash
mkdir -p icons
# Create minimal 1x1 pixel PNGs as placeholders (base64 encoded)
node -e "
const fs = require('fs');
const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('icons/icon16.png', png1x1);
fs.writeFileSync('icons/icon48.png', png1x1);
fs.writeFileSync('icons/icon128.png', png1x1);
console.log('icons created');
"
```

Expected output: `icons created`

- [ ] **Step 2: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Deslopifier",
  "version": "1.0.0",
  "description": "Hides posts from Stan/Stanley, Boardy, and Polarity on Twitter/X and LinkedIn.",
  "permissions": ["storage"],
  "host_permissions": [
    "https://twitter.com/*",
    "https://x.com/*",
    "https://www.linkedin.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://twitter.com/*",
        "https://x.com/*",
        "https://www.linkedin.com/*"
      ],
      "js": ["matcher.js", "content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add manifest.json icons/
git commit -m "feat: add manifest and icon placeholders"
```

---

## Task 2: Matching logic (pure functions + tests)

**Files:**
- Create: `matcher.js`
- Create: `test/matcher.test.js`

The matching logic lives in pure functions that take strings — no DOM, no Chrome APIs. This makes it testable with plain Node.js.

- [ ] **Step 1: Create test/matcher.test.js**

```bash
mkdir -p test
```

```js
// test/matcher.test.js
// Run with: node test/matcher.test.js

// matcher.js uses module.exports when running in Node, but is a plain script in Chrome.
// We load it by reading and eval-ing it to avoid ES module/CJS friction.
const fs = require('fs');
eval(fs.readFileSync('./matcher.js', 'utf8'));

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

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test to verify it fails (matcher.js doesn't exist yet)**

```bash
node test/matcher.test.js
```

Expected: `Error: Cannot find module` or `ReferenceError: bodyMatches is not defined`

- [ ] **Step 3: Create matcher.js**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node test/matcher.test.js
```

Expected output (all passing):
```
--- bodyMatches ---
  ✓ matches stanforcreators
  ✓ matches stan_store
  ...

--- authorMatches ---
  ✓ matches "stan" in author
  ...

13 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add matcher.js test/matcher.test.js
git commit -m "feat: add matcher pure functions with passing tests"
```

---

## Task 3: content.js — platform config + scanAndHide

**Files:**
- Create: `content.js`

- [ ] **Step 1: Create content.js with platform config and scanAndHide**

```js
// content.js

const PLATFORMS = {
  twitter: {
    post: 'article[data-testid="tweet"]',
    handle: '[data-testid="User-Name"] a[href]',
    authorName: '[data-testid="User-Name"] span',
    body: '[data-testid="tweetText"]',
  },
  linkedin: {
    post: '.feed-shared-update-v2',
    handle: '.update-components-actor__name',
    authorName: '.update-components-actor__description',
    body: '.feed-shared-text',
  },
};

function getPlatform() {
  const host = location.hostname;
  if (host.includes('twitter.com') || host.includes('x.com')) return PLATFORMS.twitter;
  if (host.includes('linkedin.com')) return PLATFORMS.linkedin;
  return null;
}

function getTextContent(el, selector) {
  const node = el.querySelector(selector);
  return node ? node.textContent : '';
}

function shouldHide(postEl, platform) {
  const handle = getTextContent(postEl, platform.handle);
  const authorName = getTextContent(postEl, platform.authorName);
  const body = getTextContent(postEl, platform.body);

  if (authorMatches(handle)) return true;
  if (authorMatches(authorName)) return true;
  if (bodyMatches(body)) return true;
  return false;
}

let hiddenCount = 0;

function hidePost(postEl) {
  if (postEl.dataset.deslopified) return;
  postEl.style.display = 'none';
  postEl.dataset.deslopified = 'true';
  hiddenCount++;
  chrome.storage.session.get({ hiddenTotal: 0 }, (data) => {
    chrome.storage.session.set({ hiddenTotal: data.hiddenTotal + 1 });
  });
}

function unhideAll() {
  document.querySelectorAll('[data-deslopified="true"]').forEach((el) => {
    el.style.display = '';
    el.removeAttribute('data-deslopified');
  });
}

function scanAndHide(platform) {
  document.querySelectorAll(platform.post).forEach((postEl) => {
    if (shouldHide(postEl, platform)) hidePost(postEl);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add content.js
git commit -m "feat: add content script platform config and scanAndHide"
```

---

## Task 4: content.js — MutationObserver + storage init + message listener

**Files:**
- Modify: `content.js` (append to existing file)

- [ ] **Step 1: Append initialization logic to content.js**

Add the following to the bottom of `content.js`:

```js
// Initialization
const platform = getPlatform();
if (!platform) {
  // Not on a supported platform, do nothing
} else {
  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (!enabled) return;

    scanAndHide(platform);

    const observer = new MutationObserver(() => {
      scanAndHide(platform);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'TOGGLE') {
        if (msg.enabled) {
          scanAndHide(platform);
        } else {
          unhideAll();
        }
      }
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add content.js
git commit -m "feat: add MutationObserver, storage init, and toggle message handler"
```

---

## Task 5: popup.html + popup.js

**Files:**
- Create: `popup.html`
- Create: `popup.js`

- [ ] **Step 1: Create popup.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      width: 220px;
      padding: 16px;
      margin: 0;
      background: #fff;
      color: #111;
    }
    h1 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    label {
      font-size: 13px;
    }
    /* Toggle switch */
    .switch {
      position: relative;
      width: 36px;
      height: 20px;
    }
    .switch input { display: none; }
    .slider {
      position: absolute;
      inset: 0;
      background: #ccc;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .slider::before {
      content: '';
      position: absolute;
      width: 14px;
      height: 14px;
      left: 3px;
      top: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    input:checked + .slider { background: #1d9bf0; }
    input:checked + .slider::before { transform: translateX(16px); }
    .counter {
      font-size: 12px;
      color: #555;
    }
  </style>
</head>
<body>
  <h1>Deslopifier</h1>
  <div class="row">
    <label for="toggle">Active</label>
    <label class="switch">
      <input type="checkbox" id="toggle" />
      <span class="slider"></span>
    </label>
  </div>
  <div class="counter" id="counter">0 posts hidden this session</div>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create popup.js**

```js
// popup.js

const toggle = document.getElementById('toggle');
const counter = document.getElementById('counter');

// Load current state
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  toggle.checked = enabled;
});

chrome.storage.session.get({ hiddenTotal: 0 }, ({ hiddenTotal }) => {
  counter.textContent = `${hiddenTotal} post${hiddenTotal === 1 ? '' : 's'} hidden this session`;
});

// On toggle change, persist and notify content script
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE', enabled }).catch(() => {
        // Tab may not have content script (e.g., not on a supported page) — ignore
      });
    }
  });
});
```

- [ ] **Step 3: Add `tabs` permission to manifest.json**

The popup needs `chrome.tabs.query`. Update `manifest.json` permissions:

```json
"permissions": ["storage", "tabs"],
```

- [ ] **Step 4: Commit**

```bash
git add popup.html popup.js manifest.json
git commit -m "feat: add popup UI with toggle and session counter"
```

---

## Task 6: Manual install and test

No automated test can cover live DOM behavior — this task walks through manual verification in Chrome.

- [ ] **Step 1: Load extension in Chrome**

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `deslopifier/` folder
4. Verify "Deslopifier" appears in the extensions list with no errors

- [ ] **Step 2: Verify Twitter/X hiding**

1. Navigate to `https://x.com/home`
2. Open DevTools Console
3. Paste and run:

```js
// Simulate a tweet article mentioning @boardy_ai
const art = document.querySelector('article[data-testid="tweet"]');
if (art) {
  const body = art.querySelector('[data-testid="tweetText"]');
  if (body) console.log('tweet body text:', body.textContent);
}
```

4. Manually search for `boardy_ai` on X and verify matching posts disappear
5. Click the Deslopifier popup icon, toggle off — verify hidden posts reappear
6. Toggle back on — verify they hide again

- [ ] **Step 3: Verify LinkedIn hiding**

1. Navigate to `https://www.linkedin.com/feed/`
2. Scroll through feed — any post from an account with "Polarity", "Stan", or "Boardy" in their name or job title should be hidden
3. Toggle off in popup — posts reappear
4. Toggle on — posts hide again

- [ ] **Step 4: Verify counter increments**

1. Reload the feed page
2. Open popup — counter should reflect posts hidden in this browser session
3. Close and reopen browser — counter resets to 0

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: complete deslopifier v1.0"
```
