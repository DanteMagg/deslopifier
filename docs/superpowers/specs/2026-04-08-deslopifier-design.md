# Deslopifier Chrome Extension — Design Spec
**Date:** 2026-04-08

## Overview

A Chrome extension that hides social media posts related to three companies — Stan/Stanley, Boardy, and Polarity — on Twitter/X and LinkedIn. Targets posts that tag the official accounts or come from employees of these companies.

---

## Target Platforms

- `twitter.com` / `x.com`
- `linkedin.com`

---

## What Gets Hidden

A post is hidden if any of the following match:

### Author signals (check the post header/byline)
- The poster's handle matches a known official account
- The poster's display name contains a brand keyword
- The poster's job title/employer (LinkedIn only — shown under name in feed) contains "at Stan", "at Boardy", or "at Polarity"

### Content signals (check the post body text)
- The post text contains an official handle mention

### Official handles to match (case-insensitive)
| Brand | X handles | LinkedIn company name |
|---|---|---|
| Stan/Stanley | `@stanforcreators`, `@stan_store` | `Stan` |
| Boardy | `@boardy_ai`, `@boardyai` | `Boardy` |
| Polarity | `@polarityco` | `Polarity` |

### Keyword matching rules
- **In post body:** match exact handle strings only (`stanforcreators`, `stan_store`, `boardy_ai`, `boardyai`, `polarityco`, `stan.store`, `boardy.ai`, `polarity.cc`)
- **In author/employer field:** match brand keywords broadly (`stan`, `boardy`, `polarity`) — this is a narrower DOM target so false positives are acceptable
- "polarity", "stan", "boardy" are NOT matched in free-form post body text to avoid false positives

---

## Architecture

Four files, Manifest V3:

```
deslopifier/
  manifest.json        # MV3 manifest, declares content scripts + popup
  content.js           # Injected into twitter.com and linkedin.com
  popup.html           # On/off toggle + hidden post counter
  popup.js             # Reads/writes extension enabled state via chrome.storage
```

No background service worker needed — storage events and DOM work are handled entirely in the content script and popup.

---

## content.js Behavior

1. On load, check `chrome.storage.sync` for enabled state (default: enabled).
2. Run `scanAndHide()` over all current post elements.
3. Attach a `MutationObserver` on the feed container to catch new posts from infinite scroll — call `scanAndHide()` on each batch.
4. On toggle message from popup, re-run scan (hide) or un-hide all previously hidden posts.

**Platform-specific selectors:**

| Platform | Post container selector | Author handle selector | Author name/title selector | Post body selector |
|---|---|---|---|---|
| Twitter/X | `article[data-testid="tweet"]` | `[data-testid="User-Name"] a[href]` | `[data-testid="User-Name"] span` | `[data-testid="tweetText"]` |
| LinkedIn | `.feed-shared-update-v2` | `.update-components-actor__name` | `.update-components-actor__description` | `.feed-shared-text` |

**Hide mechanic:** Set `element.style.display = 'none'` on the post container. Mark it with `data-deslopified="true"` so it can be un-hidden on toggle-off.

---

## Popup UI

- Toggle switch: enabled / disabled
- Counter: "X posts hidden this session"
- State persisted in `chrome.storage.sync`
- Counter stored in `chrome.storage.session` (resets on browser close)

---

## Error Handling

- If a selector returns null (platform updates their DOM), skip silently — don't crash the observer.
- No network requests. No permissions beyond `storage` and host access to twitter.com/x.com/linkedin.com.

---

## Out of Scope

- Hiding posts that merely discuss these companies without tagging them
- Safari / Firefox support
- Options page / custom keyword configuration
- Syncing hidden-post list across devices
