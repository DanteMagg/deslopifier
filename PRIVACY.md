# Privacy Policy

**Deslopifier** is a Chrome extension that hides feed posts matching keywords you define.

## Data collected

None. Deslopifier does not collect, transmit, or share any data.

## Data stored

Your keywords and on/off toggle state are stored locally in your browser using `chrome.storage.sync`. This data syncs across your Chrome devices via your Google account but is never sent to or accessible by the extension developer.

A hidden post counter is stored in `chrome.storage.session` and is cleared when you close the browser.

## Permissions

- **storage** — to save your keywords and toggle state locally.
- **Host permissions for linkedin.com, twitter.com, x.com** — to run the content script that scans and collapses matching posts on those pages.

## Contact

For questions or issues, open a GitHub issue at https://github.com/DanteMagg/deslopifier
