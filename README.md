# Teleprompter Script Tool

Display a script over a webpage with adjustable scroll speed, font size, opacity, themes and mirroring.

## Install the bookmarklet

1. Create a bookmark named **Teleprompter**.
2. Open [bookmarklet.txt](bookmarklet.txt) and copy its single line into the bookmark URL.
3. Open a regular webpage, activate the bookmark and paste sample text into the editor. Save the text, then choose **Play**.

Some browser-internal pages and sites with restrictive policies block bookmarklets. The overlay inserts text into the host page, where that page and its scripts may be able to read it. Use a trusted page and keep confidential scripts in the standalone version.

## Use the standalone version

Download and open [the standalone HTML file](demo/Improved_Teleprompter_App.html). Both versions use system fonts and require no network for teleprompter functions. The standalone file is useful when a site blocks the overlay or you want to keep the script out of a site's DOM.

## Build

From the repository root, use Node.js 24 or later.

```sh
node --check src/teleprompter.js
node build-bookmarklet.mjs > bookmarklet.txt
```

The generated URL contains the maintained source directly. The smoke test uses synthetic content. Run it in Chromium and verify installation in native Safari before claiming browser compatibility.

With Playwright and Chromium available, run `node test/bookmarklet.cjs`. Set `CHROMIUM_PATH` if using a system Chromium installation.
