# Deslopifier

Hides posts about **Stan**, **Boardy**, and **Polarity** from your LinkedIn and Twitter/X feed.

## Install

1. Go to the [Releases](../../releases) page and download `deslopifier.zip`, or click **Code → Download ZIP** on this page
2. Unzip the file
3. Open Chrome and go to `chrome://extensions`
4. Enable **Developer mode** (toggle in the top right)
5. Click **Load unpacked** and select the unzipped `deslopifier` folder
6. Done — the extension icon will appear in your toolbar

## Usage

- Click the extension icon to toggle it on/off
- The popup shows how many posts have been hidden this session
- Open DevTools (F12) on LinkedIn or Twitter/X to see which posts were hidden and why

## What it filters

- Posts **from** employees of Stan, Boardy, or Polarity (detected via job title)
- Posts that **mention** these companies by name or handle
- LinkedIn activity posts ("X liked this") where the original post is about these companies
