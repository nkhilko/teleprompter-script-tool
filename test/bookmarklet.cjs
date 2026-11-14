const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Script } = require("node:vm");
const { chromium } = require("playwright");

const repo = path.join(__dirname, "..");
const bookmarklet = fs.readFileSync(path.join(repo, "bookmarklet.txt"), "utf8").trim();
const source = fs.readFileSync(path.join(repo, "src/teleprompter.js"), "utf8");
const payload = decodeURIComponent(bookmarklet.slice("javascript:".length));
assert.equal(payload, "void " + source);
new Script(payload);

async function run() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox", "--disable-background-networking"] });
  try {
    const context = await browser.newContext({ serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    const unexpected = [];
    await context.route("**/*", route => {
      if (route.request().url() !== "http://teleprompter.test/") {
        unexpected.push(route.request().url());
        return route.abort();
      }
      return route.fulfill({ contentType: "text/html", body: '<a id="install">Open teleprompter</a>' });
    });
    await page.goto("http://teleprompter.test/");
    await page.locator("#install").evaluate((el, url) => el.href = url, bookmarklet);
    const overlay = page.locator("#nk-teleprompter");
    const action = name => overlay.locator(`[data-act="${name}"]`);
    await page.locator("#install").click();
    const editor = overlay.locator("textarea");
    const text = Array(35).fill("Synthetic script for browser verification.").join("\n");
    await page.evaluate(text => navigator.clipboard.writeText(text), text);
    await editor.focus();
    await page.keyboard.press("Control+v");
    assert.equal(await editor.inputValue(), text);
    await page.keyboard.type(" m");
    assert.equal(await editor.inputValue(), text + " m");
    await action("save").click();
    await action("speed+").click();
    assert.match(await overlay.innerText(), /Speed 70px/);
    await action("mirror").click();
    assert.equal(await overlay.locator(".nk-container").evaluate(el => el.style.transform), "scaleX(-1)");
    await action("mirror").click();
    await action("play").click();
    await page.waitForFunction(() => document.querySelector(".nk-body").scrollTop > 5);
    await action("pause").click();
    const paused = await overlay.locator(".nk-body").evaluate(el => el.scrollTop);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await overlay.locator(".nk-body").evaluate(el => el.scrollTop), paused);
    await action("close").click();
    assert.equal(await overlay.count(), 0);
    assert.equal(await page.locator("#nk-teleprompter-css").count(), 0);
    await page.locator("#install").click();
    assert.equal(await overlay.count(), 1);
    await action("cancel").click();
    await action("close").click();
    assert.deepEqual(unexpected, []);
  } finally {
    await browser.close();
  }
}
run().then(() => console.log("Bookmarklet smoke passed"), error => { console.error(error); process.exitCode = 1; });
