---

# 2) `src/teleprompter.js`

```javascript
/* Teleprompter Script Tool — readable source
   Author: Nikita Khilko (nkhilko)
   License: MIT
*/
(function () {
  const ROOT_ID = "nk-teleprompter";
  if (document.getElementById(ROOT_ID)) return;

  // ---- Inject CSS
  function inject(css) {
    const style = document.createElement("style");
    style.id = "nk-teleprompter-css";
    style.type = "text/css";
    style.innerHTML = css;
    document.head.appendChild(style);
    return style;
  }

  const CSS = `
#${ROOT_ID} { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000000; font-family: -apple-system, Segoe UI, Arial, sans-serif; }
#${ROOT_ID} .nk-container {
  position: fixed; right: 16px; bottom: 16px; width: 440px; max-width: 90%; height: 480px;
  background: rgba(25,25,25,.88); color: #fff; box-shadow: 0 8px 20px rgba(0,0,0,.25);
  border-radius: 16px; padding: 20px; overflow: hidden; transition: opacity .2s;
}
#${ROOT_ID} .nk-header {
  display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,.25);
  border-bottom: 1px solid rgba(0,0,0,.25); padding: 10px 16px; font-weight: 600; cursor: move;
}
#${ROOT_ID} .nk-body { height: calc(100% - 62px); overflow: auto; padding-top: 16px; }
#${ROOT_ID} .nk-script {
  font-size: 48px; line-height: 1.7; letter-spacing: .02em; white-space: pre-line; word-wrap: break-word;
  user-select: none; padding: 16px 24px; text-align: left;
}
#${ROOT_ID} .nk-footer {
  display: flex; gap: 8px; padding: 10px 16px; background: rgba(0,0,0,.25);
  border-top: 1px solid rgba(0,0,0,.25); font-size: 9px; color: #fff; opacity: .8;
}
#${ROOT_ID} .nk-btn { padding: 2px 8px; font-size: 10px; border: 1px solid transparent; border-radius: 12px; background: rgba(128,128,128,.35); cursor: pointer; margin-right: 8px; }
#${ROOT_ID} .nk-btn.primary { background: rgba(255,95,95,.8); color: #000; }
#${ROOT_ID} .nk-info { margin-left: auto; }
#${ROOT_ID} .nk-editor { position: fixed; inset: 10% 15%; background: rgba(0,0,0,.85); color:#fff; border-radius: 16px; padding: 16px; display: none; z-index: 1000001; }
#${ROOT_ID} .nk-editor textarea { width: 100%; height: 60vh; background: transparent; border:1px solid rgba(255,255,255,.2); color:#fff; padding:10px; font: 16px/1.5 -apple-system, Segoe UI, Arial; }
#${ROOT_ID}.light .nk-container, #${ROOT_ID}.light .nk-header, #${ROOT_ID}.light .nk-footer { background: rgba(255,255,255,.92); color: #000; border-color: rgba(0,0,0,.1); }
#${ROOT_ID}.dark .nk-container, #${ROOT_ID}.dark .nk-header, #${ROOT_ID}.dark .nk-footer { background: rgba(0,0,0,.85); color: #fff; border-color: rgba(0,0,0,.25); }
`;

  inject(CSS);

  // ---- DOM
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "dark";
  root.innerHTML = `
    <div class="nk-container">
      <div class="nk-header">
        <button class="nk-btn primary" data-act="play">▶︎ Play</button>
        <button class="nk-btn" data-act="pause">⏸︎ Pause</button>
        <button class="nk-btn" data-act="rewind">↺ Rewind</button>
        <button class="nk-btn" data-act="speed-">– Speed</button>
        <button class="nk-btn" data-act="speed+">+ Speed</button>
        <button class="nk-btn" data-act="font-">– Font</button>
        <button class="nk-btn" data-act="font+">+ Font</button>
        <button class="nk-btn" data-act="opacity-">– Opacity</button>
        <button class="nk-btn" data-act="opacity+">+ Opacity</button>
        <button class="nk-btn" data-act="mirror">🪞 Mirror</button>
        <button class="nk-btn" data-act="theme">☯ Theme</button>
        <button class="nk-btn" data-act="edit">✎ Edit</button>
        <button class="nk-btn" data-act="close">✕ Close</button>
      </div>
      <div class="nk-body"><div class="nk-script" contenteditable="false"></div></div>
      <div class="nk-footer"><span class="nk-info"></span></div>
    </div>
    <div class="nk-editor">
      <textarea placeholder="Paste your script here..."></textarea>
      <div style="margin-top:8px;">
        <button class="nk-btn primary" data-act="save">Save</button>
        <button class="nk-btn" data-act="cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const els = {
    body: root.querySelector(".nk-body"),
    script: root.querySelector(".nk-script"),
    header: root.querySelector(".nk-header"),
    info: root.querySelector(".nk-info"),
    editor: root.querySelector(".nk-editor"),
    textarea: root.querySelector("textarea"),
    container: root.querySelector(".nk-container"),
  };

  // ---- State
  const st = {
    playing: false,
    speed: 60, // px/s
    font: 48, // px
    opacity: 0.96,
    mirror: false,
    theme: "dark",
    y: 0,
    raf: null,
  };

  function render() {
    els.container.style.opacity = st.opacity;
    els.script.style.fontSize = st.font + "px";
    root.classList.toggle("dark", st.theme === "dark");
    root.classList.toggle("light", st.theme === "light");
    els.container.style.transform = st.mirror ? "scaleX(-1)" : "none";
    els.info.textContent = `Speed ${st.speed}px/s · Font ${st.font}px · Opacity ${Math.round(
      st.opacity * 100
    )}%`;
  }

  function ensureScript() {
    if (!els.script.textContent.trim()) toggleEditor(true);
  }

  function tick() {
    if (!st.playing) {
      st.raf = null;
      return;
    }
    els.body.scrollTop = st.y += st.speed / 60;
    st.raf = requestAnimationFrame(tick);
  }

  function play() {
    ensureScript();
    if (st.playing) return;
    st.playing = true;
    st.raf = requestAnimationFrame(tick);
  }
  function pause() {
    st.playing = false;
  }
  function rewind() {
    st.y = 0;
    els.body.scrollTop = 0;
  }

  function toggleEditor(show) {
    els.editor.style.display = show ? "block" : "none";
    if (show) {
      els.textarea.value = els.script.textContent.trim();
      els.textarea.focus();
    }
  }
  function saveScript() {
    els.script.textContent = els.textarea.value || " ";
    toggleEditor(false);
  }

  // ---- Events
  function onClick(e) {
    const a = e.target.closest("[data-act]");
    if (!a) return;
    const act = a.getAttribute("data-act");
    if (act === "play") play();
    else if (act === "pause") pause();
    else if (act === "rewind") rewind();
    else if (act === "speed-") st.speed = Math.max(5, st.speed - 10);
    else if (act === "speed+") st.speed = Math.min(300, st.speed + 10);
    else if (act === "font-") st.font = Math.max(16, st.font - 2);
    else if (act === "font+") st.font = Math.min(120, st.font + 2);
    else if (act === "opacity-") st.opacity = Math.max(0.2, st.opacity - 0.05);
    else if (act === "opacity+") st.opacity = Math.min(1, st.opacity + 0.05);
    else if (act === "mirror") st.mirror = !st.mirror;
    else if (act === "theme") st.theme = st.theme === "dark" ? "light" : "dark";
    else if (act === "edit") toggleEditor(true);
    else if (act === "save") saveScript();
    else if (act === "cancel") toggleEditor(false);
    else if (act === "close") cleanup();

    render();
  }

  function onKey(e) {
    const k = e.key.toLowerCase();
    if (k === " ") {
      e.preventDefault();
      st.playing ? pause() : play();
    } else if (k === "+") {
      st.speed = Math.min(300, st.speed + 10);
    } else if (k === "-") {
      st.speed = Math.max(5, st.speed - 10);
    } else if (k === "[") {
      st.font = Math.max(16, st.font - 2);
    } else if (k === "]") {
      st.font = Math.min(120, st.font + 2);
    } else if (k === "o") {
      st.opacity = Math.max(0.2, st.opacity - 0.05);
    } else if (k === "p") {
      st.opacity = Math.min(1, st.opacity + 0.05);
    } else if (k === "m") {
      st.mirror = !st.mirror;
    } else if (k === "escape") {
      cleanup();
    }
    render();
  }

  function makeDraggable(handle, box) {
    let sx, sy, sl, stp, drag = false;
    handle.style.cursor = "move";
    handle.addEventListener("mousedown", (e) => {
      drag = true;
      sx = e.clientX; sy = e.clientY;
      const r = box.getBoundingClientRect();
      sl = r.left; stp = r.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      box.style.position = "fixed";
      box.style.left = Math.max(8, sl + dx) + "px";
      box.style.top = Math.max(8, stp + dy) + "px";
    });
    document.addEventListener("mouseup", () => (drag = false));
  }

  function cleanup() {
    pause();
    root.remove();
    const s = document.getElementById("nk-teleprompter-css");
    if (s) s.remove();
    document.removeEventListener("keydown", onKey);
  }

  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  makeDraggable(els.header, els.container);

  render();
  // Ask for script if empty
  if (!els.script.textContent.trim()) toggleEditor(true);
})();
