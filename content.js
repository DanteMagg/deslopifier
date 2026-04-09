// content.js
// bodyMatches, authorMatches, linkedinMatches are globals injected by matcher.js (loaded first in manifest)

function isExtensionAlive() {
  try {
    return !!chrome.runtime?.id;
  } catch (_) {
    return false;
  }
}

function safeChromeCall(fn) {
  if (!isExtensionAlive()) return;
  try { fn(); } catch (_) {}
}

const PLATFORMS = {
  twitter: {
    post: 'article[data-testid="tweet"]',
    handle: '[data-testid="User-Name"] a[href]',
    authorName: '[data-testid="User-Name"] span',
    body: '[data-testid="tweetText"]',
  },
  // LinkedIn obfuscates class names on every deploy, so we use a fallback
  // selector chain and scan the entire post's text content instead of
  // targeting specific sub-elements.
  linkedin: {
    postSelectors: [
      '[role="listitem"][componentkey]', // current LinkedIn (2026): ARIA listitem + component key
      '[data-urn*="activity"]',          // older LinkedIn feed activity posts
      '.fie-impression-container',        // older LinkedIn feed impression wrapper
      '.occludable-update',               // older LinkedIn post wrapper
      'article',                          // semantic fallback
      '[data-urn]',                       // any URN-tagged element
      '.feed-shared-update-v2',           // legacy class
    ],
  },
};

function getPlatform() {
  const host = location.hostname;
  if (host.includes('twitter.com') || host.includes('x.com')) return PLATFORMS.twitter;
  if (host.includes('linkedin.com')) return PLATFORMS.linkedin;
  return null;
}

function getLinkedInPosts() {
  for (const sel of PLATFORMS.linkedin.postSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      // Filter out nested elements (comments inside posts)
      return [...els].filter((el) => !el.parentElement.closest(sel));
    }
  }
  return [];
}

function getTextContent(el, selector) {
  const node = el.querySelector(selector);
  return node ? node.textContent : '';
}

function getLinkedInPostText(postEl) {
  return postEl.textContent;
}

let customKeywords = [];

function customMatches(text) {
  if (!customKeywords.length) return false;
  const lower = text.toLowerCase();
  return customKeywords.some((kw) => lower.includes(kw));
}

const LINK_PATTERNS = [
  'stan.store', 'stanforcreators', 'boardy', 'polarity.cc', 'polarityco',
  '/company/stanley-from-stan',
];

function linkedInLinkMatches(postEl) {
  // Check anchor hrefs for direct links to company pages (catches e.g. hyperlinked "Stanley")
  for (const a of postEl.querySelectorAll('a[href]')) {
    const href = a.href.toLowerCase();
    if (LINK_PATTERNS.some((p) => href.includes(p))) return true;
  }
  return false;
}

function shouldHide(postEl, platform) {
  const fullText = platform.postSelectors ? getLinkedInPostText(postEl) : null;
  if (fullText !== null) {
    return linkedinMatches(fullText) || customMatches(fullText) || linkedInLinkMatches(postEl);
  }
  const handle = getTextContent(postEl, platform.handle);
  const authorName = getTextContent(postEl, platform.authorName);
  const body = getTextContent(postEl, platform.body);
  if (authorMatches(handle) || customMatches(handle)) return true;
  if (authorMatches(authorName) || customMatches(authorName)) return true;
  if (bodyMatches(body) || customMatches(body)) return true;
  return false;
}

function getPostUrl(postEl) {
  const tweetLink = postEl.querySelector('a[href*="/status/"]');
  if (tweetLink) return tweetLink.href;
  // Try any anchor containing a LinkedIn post URN
  const liLink = postEl.querySelector(
    'a[href*="/feed/update/"], a[href*="/posts/"], a[href*="urn:li:ugcPost"], a[href*="urn:li:activity"]'
  );
  if (liLink) return liLink.href;
  // Fall back to data-urn on the element or a descendant
  const urnEl = postEl.querySelector('[data-urn*="activity"], [data-urn*="ugcPost"]');
  const urn = urnEl?.dataset.urn ?? (postEl.dataset.urn?.match(/urn:li:(activity|ugcPost):[^?&\s]+/)?.[0]);
  if (urn) return `https://www.linkedin.com/feed/update/${urn}/`;
  // Activity posts ("X commented/liked") have no post permalink — link to post author's profile instead
  // (first distinct /in/ = commenter/liker, second = post author)
  const profiles = [...new Set([...postEl.querySelectorAll('a[href*="linkedin.com/in/"]')].map((a) => a.href))];
  if (profiles.length >= 2) return profiles[1] + 'recent-activity/all/';
  if (profiles.length === 1) return profiles[0] + 'recent-activity/all/';
  return null;
}

function getMatchReason(text) {
  const lower = text.toLowerCase();
  const allKw = ['stanforcreators','stan_store','stan.store','boardy_ai','boardyai','boardy.ai','polarity.cc','polarityco','polarity','boardy'];
  for (const kw of allKw) {
    if (lower.includes(kw)) return `keyword:"${kw}"`;
  }
  if (/\bstan\b/i.test(text)) return 'keyword:"stan" (word boundary)';
  return 'unknown';
}

let localHiddenCount = 0;
let syncTimeout = null;

function hidePost(postEl) {
  if (postEl.dataset.deslopified) return;
  postEl.style.cssText += ';height:0!important;min-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:none!important;';
  postEl.dataset.deslopified = 'true';
  const url = getPostUrl(postEl);
  const reason = getMatchReason(postEl.textContent);
  const snippet = postEl.textContent.slice(0, 80).trim();
  console.log('[Deslopifier] Hidden:', url || '(no link)', `(${reason})`, '—', snippet);
  
  localHiddenCount++;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    safeChromeCall(() => {
      chrome.storage.session.get({ hiddenTotal: 0 }, (data) => {
        safeChromeCall(() => {
          chrome.storage.session.set({ hiddenTotal: data.hiddenTotal + localHiddenCount });
          localHiddenCount = 0;
        });
      });
    });
  }, 500);
}

function unhideAll() {
  document.querySelectorAll('[data-deslopified="true"]').forEach((el) => {
    el.style.cssText = el.style.cssText
      .replace(/height:[^;]+;?/gi, '')
      .replace(/min-height:[^;]+;?/gi, '')
      .replace(/overflow:[^;]+;?/gi, '')
      .replace(/margin:[^;]+;?/gi, '')
      .replace(/padding:[^;]+;?/gi, '')
      .replace(/border:[^;]+;?/gi, '');
    el.removeAttribute('data-deslopified');
  });
}

const idle = window.requestIdleCallback
  ? (cb) => window.requestIdleCallback(cb, { timeout: 500 })
  : (cb) => setTimeout(cb, 0);

function evaluatePosts(posts, platform) {
  for (const postEl of posts) {
    if (!postEl.dataset.deslopified && shouldHide(postEl, platform)) hidePost(postEl);
  }
}

function scanAndHide(platform) {
  const posts = platform.postSelectors
    ? getLinkedInPosts()
    : document.querySelectorAll(platform.post);
  evaluatePosts(posts, platform);
}

// Find post elements within a set of newly added nodes (avoids full DOM scan)
function findNewPosts(addedNodes, platform) {
  const results = [];
  if (platform.postSelectors) {
    for (const sel of PLATFORMS.linkedin.postSelectors) {
      let found = false;
      for (const node of addedNodes) {
        if (node.matches?.(sel) && !node.parentElement?.closest(sel)) {
          results.push(node);
          found = true;
        }
        node.querySelectorAll?.(sel).forEach((el) => {
          if (!el.parentElement?.closest(sel)) { results.push(el); found = true; }
        });
      }
      if (found) break;
    }
  } else {
    for (const node of addedNodes) {
      if (node.matches?.(platform.post)) results.push(node);
      node.querySelectorAll?.(platform.post).forEach((el) => results.push(el));
    }
  }
  return results;
}

// Initialization
const platform = getPlatform();
if (platform) {
  safeChromeCall(() => {
    chrome.storage.sync.get({ enabled: true, customKeywords: [] }, ({ enabled, customKeywords: kws }) => {
      customKeywords = kws;
      if (enabled) scanAndHide(platform);

      let pendingNodes = [];
      let debounceTimer = null;
      const observer = new MutationObserver((mutations) => {
        if (!isExtensionAlive()) {
          observer.disconnect();
          return;
        }
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) pendingNodes.push(node);
          }
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const nodes = pendingNodes.splice(0);
          if (!nodes.length) return;
          try {
            chrome.storage.sync.get({ enabled: true }, ({ enabled: isEnabled }) => {
              if (!isEnabled) return;
              idle(() => evaluatePosts(findNewPosts(nodes, platform), platform));
            });
          } catch (_) {
            observer.disconnect();
          }
        }, 200);
      });

      observer.observe(document.body, { childList: true, subtree: true });

      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === 'TOGGLE') {
          if (msg.enabled) { scanAndHide(platform); } else { unhideAll(); }
          sendResponse({ success: true });
        }
        if (msg.type === 'KEYWORDS_UPDATED') {
          chrome.storage.sync.get({ customKeywords: [] }, ({ customKeywords: kws }) => {
            customKeywords = kws;
            scanAndHide(platform);
          });
        }
      });
    });
  });
}
