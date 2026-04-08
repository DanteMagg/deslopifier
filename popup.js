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

// Keep counter live while popup is open
chrome.storage.session.onChanged.addListener((changes) => {
  if (changes.hiddenTotal) {
    const count = changes.hiddenTotal.newValue;
    counter.textContent = `${count} post${count === 1 ? '' : 's'} hidden this session`;
  }
});
