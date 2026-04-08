// content.js
// bodyMatches and authorMatches are globals injected by matcher.js (loaded first in manifest)

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
    postSelectors: ['article', '[data-urn]', '.feed-shared-update-v2'],
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
    if (els.length > 0) return els;
  }
  return [];
}

function getTextContent(el, selector) {
  const node = el.querySelector(selector);
  return node ? node.textContent : '';
}

function shouldHide(postEl, platform) {
  if (platform.postSelectors) {
    // LinkedIn: class names are obfuscated, scan full post text
    return linkedinMatches(postEl.textContent);
  }
  const handle = getTextContent(postEl, platform.handle);
  const authorName = getTextContent(postEl, platform.authorName);
  const body = getTextContent(postEl, platform.body);
  if (authorMatches(handle)) return true;
  if (authorMatches(authorName)) return true;
  if (bodyMatches(body)) return true;
  return false;
}

function hidePost(postEl) {
  if (postEl.dataset.deslopified) return;
  postEl.style.display = 'none';
  postEl.dataset.deslopified = 'true';
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
  const posts = platform.postSelectors
    ? getLinkedInPosts()
    : document.querySelectorAll(platform.post);
  posts.forEach((postEl) => {
    if (shouldHide(postEl, platform)) hidePost(postEl);
  });
}

// Initialization
const platform = getPlatform();
if (platform) {
  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (enabled) scanAndHide(platform);

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      try {
        chrome.storage.sync.get({ enabled: true }, ({ enabled: isEnabled }) => {
          if (!isEnabled) return;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => scanAndHide(platform), 100);
        });
      } catch (e) {
        observer.disconnect();
      }
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
