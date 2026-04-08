// content.js
// bodyMatches and authorMatches are globals injected by matcher.js (loaded first in manifest)

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
  document.querySelectorAll(platform.post).forEach((postEl) => {
    if (shouldHide(postEl, platform)) hidePost(postEl);
  });
}

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
