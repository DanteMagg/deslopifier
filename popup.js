// popup.js

const toggle = document.getElementById('toggle');
const counter = document.getElementById('counter');
const keywordInput = document.getElementById('keyword-input');
const keywordAdd = document.getElementById('keyword-add');
const keywordsList = document.getElementById('keywords-list');

function renderKeywords(keywords) {
  if (!keywords.length) {
    keywordsList.innerHTML = '<span class="keywords-empty">No custom keywords</span>';
    return;
  }
  keywordsList.innerHTML = keywords.map((kw) =>
    `<span class="keyword-tag">${kw.replace(/</g, '&lt;')}<button data-kw="${kw.replace(/"/g, '&quot;')}" title="Remove">×</button></span>`
  ).join('');
  keywordsList.querySelectorAll('button[data-kw]').forEach((btn) => {
    btn.addEventListener('click', () => removeKeyword(btn.dataset.kw));
  });
}

function notifyContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'KEYWORDS_UPDATED' }).catch(() => {});
    }
  });
}

function addKeyword() {
  const kw = keywordInput.value.trim().toLowerCase();
  if (!kw) return;
  chrome.storage.sync.get({ keywords: [] }, ({ keywords }) => {
    if (keywords.includes(kw)) { keywordInput.value = ''; return; }
    const updated = [...keywords, kw];
    chrome.storage.sync.set({ keywords: updated }, () => {
      renderKeywords(updated);
      notifyContentScript();
      keywordInput.value = '';
    });
  });
}

function removeKeyword(kw) {
  chrome.storage.sync.get({ keywords: [] }, ({ keywords }) => {
    const updated = keywords.filter((k) => k !== kw);
    chrome.storage.sync.set({ keywords: updated }, () => {
      renderKeywords(updated);
      notifyContentScript();
    });
  });
}

// Load current state
chrome.storage.sync.get({ enabled: true, keywords: [] }, ({ enabled, keywords }) => {
  toggle.checked = enabled;
  renderKeywords(keywords);
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
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE', enabled }).catch(() => {});
    }
  });
});

keywordAdd.addEventListener('click', addKeyword);
keywordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addKeyword(); });

// Keep counter live while popup is open
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'session' && changes.hiddenTotal) {
    const count = changes.hiddenTotal.newValue;
    counter.textContent = `${count} post${count === 1 ? '' : 's'} hidden this session`;
  }
});
