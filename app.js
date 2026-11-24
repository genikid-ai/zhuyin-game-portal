/* ==========================================================================
   注音與語文遊樂園｜首頁互動與無痕密碼鎖主程式
   - 免密碼區：點選後立即開新分頁進入遊戲
   - 語文闖關區：
       1. 若 config.js 已設定 cloudAuth.apiUrl → 連線 Google 試算表 Apps Script 即時驗證（支援 4～8 碼，改試算表即全園生效）
       2. 若尚未設定 cloudAuth.apiUrl → 自動使用本機 SHA-256 加密金庫模式
   - 全程不寫入 localStorage / sessionStorage / cookie，且不含任何原生表單欄位
   ========================================================================== */
(function () {
  "use strict";

  const cfg = window.PORTAL_CONFIG;
  const vaultApi = window.PortalVault;

  if (!cfg) {
    console.error("缺少 config.js");
    return;
  }

  // ---- 判斷是否啟用 Google 試算表雲端即時驗證 ----
  const cloudApiUrl =
    cfg.cloudAuth && typeof cfg.cloudAuth.apiUrl === "string" ? cfg.cloudAuth.apiUrl.trim() : "";
  const isCloudMode = /^https:\/\/script\.google\.com\/macros\/s\/.+$/i.test(cloudApiUrl) || /^https?:\/\//i.test(cloudApiUrl);
  const cloudTimeoutMs = (cfg.cloudAuth && Number(cfg.cloudAuth.timeoutMs)) || 12000;

  const MIN_PIN_LEN = 4;
  const MAX_PIN_LEN = isCloudMode ? 8 : Math.max(4, Math.min(8, Number(cfg.pinLength) || 4));
  const LOCAL_PIN_LEN = Math.max(4, Math.min(8, Number(cfg.pinLength) || 4));

  // ---- DOM 參照 ----
  const titleEl = document.getElementById("portal-title");
  const subtitleEl = document.getElementById("portal-subtitle");
  const copyrightEl = document.getElementById("portal-copyright");
  const openGrid = document.getElementById("open-games-grid");
  const lockedGrid = document.getElementById("locked-games-grid");

  const soundBtn = document.getElementById("btn-sound");
  const fullscreenBtn = document.getElementById("btn-fullscreen");

  const modalEl = document.getElementById("pin-modal");
  const dialogEl = document.getElementById("pin-dialog");
  const modalCloseBtn = document.getElementById("btn-modal-close");
  const modalMascot = document.getElementById("modal-mascot");
  const modalStageTag = document.getElementById("modal-stage-tag");
  const modalGameTitle = document.getElementById("modal-game-title");
  const modalGameSub = document.getElementById("modal-game-sub");
  const pinDotsEl = document.getElementById("pin-dots");
  const pinFeedbackEl = document.getElementById("pin-feedback");
  const keypadEl = document.getElementById("keypad-grid");
  const confirmBtn = document.getElementById("btn-pin-confirm");
  const confirmBtnText = document.getElementById("btn-pin-confirm-text");
  const directLaunchLink = document.getElementById("btn-direct-launch");
  const directLaunchText = document.getElementById("btn-direct-launch-text");
  const toastEl = document.getElementById("portal-toast");

  // ---- 僅存在於記憶體的暫時狀態（頁面重整或關閉視窗即歸零） ----
  let soundEnabled = true;
  let audioCtx = null;
  let activeGame = null;
  let pinDigits = [];
  let isLockedBusy = false;
  let toastTimer = null;
  let lastFocusedTrigger = null;

  // ---- 柔和繪本木琴音效（Web Audio API） ----
  function playTone(freq, duration, type, gainValue, delay) {
    if (!soundEnabled) return;
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;
      if (!audioCtx) {
        audioCtx = new AudioContextCtor();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime + (delay || 0);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue || 0.1, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (duration || 0.14));

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + (duration || 0.14) + 0.02);
    } catch (_err) {
      // 忽略瀏覽器未解鎖音訊錯誤
    }
  }

  function sfxTap() {
    playTone(587.33, 0.09, "triangle", 0.09, 0);
  }

  function sfxOpen() {
    playTone(523.25, 0.12, "triangle", 0.1, 0);
    playTone(659.25, 0.15, "triangle", 0.1, 0.07);
  }

  function sfxSuccess() {
    playTone(523.25, 0.12, "triangle", 0.11, 0);
    playTone(659.25, 0.12, "triangle", 0.11, 0.08);
    playTone(783.99, 0.18, "triangle", 0.12, 0.16);
  }

  function sfxError() {
    playTone(260, 0.12, "sawtooth", 0.06, 0);
    playTone(210, 0.18, "sawtooth", 0.06, 0.1);
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  function openInNewTab(url) {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      try {
        win.opener = null;
      } catch (_err) {
        // 跨網域忽略
      }
      return true;
    }
    return false;
  }

  // ---- 渲染首頁標題與卡片 ----
  function initHeader() {
    if (cfg.siteTitle && titleEl) {
      titleEl.textContent = cfg.siteTitle;
      document.title = cfg.siteTitle + "｜童趣繪本學習首頁";
    }
    if (cfg.siteSubtitle && subtitleEl) subtitleEl.textContent = cfg.siteSubtitle;
    if (cfg.copyrightText && copyrightEl) copyrightEl.textContent = cfg.copyrightText;
  }

  function renderOpenGames() {
    openGrid.innerHTML = "";
    (cfg.openGames || []).forEach((game) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "game-card game-card--open " + (game.themeClass || "");
      card.style.setProperty("--card-border", game.borderColor);
      card.style.setProperty("--card-lip", game.lipColor);
      card.style.setProperty("--cta-bg", game.ctaBg);
      card.style.setProperty("--cta-lip", game.ctaLip);
      card.setAttribute("aria-label", `${game.title}（${game.subtitle}），免密碼直接開啟`);

      const bgDiv = document.createElement("div");
      bgDiv.className = "card-bg";
      bgDiv.style.backgroundImage = `url("${game.bgImage}")`;

      const scrimDiv = document.createElement("div");
      scrimDiv.className = "card-scrim";
      scrimDiv.style.background = game.scrim;

      const contentDiv = document.createElement("div");
      contentDiv.className = "card-content";

      const badgeRow = document.createElement("div");
      badgeRow.className = "open-badge-row";

      const freeChip = document.createElement("span");
      freeChip.className = "chip-tag chip-free";
      freeChip.textContent = "✨ 免密碼";
      badgeRow.appendChild(freeChip);

      (game.tags || []).forEach((t) => {
        const tag = document.createElement("span");
        tag.className = "chip-tag chip-meta";
        tag.textContent = t;
        badgeRow.appendChild(tag);
      });

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = game.title;

      const sub = document.createElement("p");
      sub.className = "card-sub";
      sub.textContent = game.subtitle;

      const cta = document.createElement("span");
      cta.className = "card-cta-open";
      cta.textContent = "直接開始 ▶";

      contentDiv.append(badgeRow, title, sub, cta);

      const mascotWrap = document.createElement("div");
      mascotWrap.className = "open-mascot-wrap";
      const mascotImg = document.createElement("img");
      mascotImg.className = "open-mascot";
      mascotImg.src = game.mascotImage;
      mascotImg.alt = "";
      mascotImg.draggable = false;
      mascotWrap.appendChild(mascotImg);

      card.append(bgDiv, scrimDiv, contentDiv, mascotWrap);

      card.addEventListener("click", () => {
        sfxOpen();
        if (!game.url) {
          showToast("尚未設定此遊戲網址，請於 config.js 中填寫連結。");
          return;
        }
        if (!openInNewTab(game.url)) {
          showToast("瀏覽器擋住了新分頁，請允許彈出視窗後再點選一次喔！");
        }
      });

      openGrid.appendChild(card);
    });
  }

  function renderLockedGames() {
    lockedGrid.innerHTML = "";
    (cfg.lockedGames || []).forEach((game) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "game-card game-card--locked";
      card.style.setProperty("--card-border", game.borderColor);
      card.style.setProperty("--card-lip", game.lipColor);
      card.style.setProperty("--stage-pill-bg", game.stageColor);
      card.style.setProperty("--cta-bg", game.ctaBg);
      card.style.setProperty("--cta-lip", game.ctaLip);
      card.setAttribute("aria-label", `語文闖關 ${game.stage} ${game.title}，需輸入密碼開啟`);

      const bgDiv = document.createElement("div");
      bgDiv.className = "card-bg";
      bgDiv.style.backgroundImage = `url("${game.bgImage}")`;

      const scrimDiv = document.createElement("div");
      scrimDiv.className = "card-scrim";
      scrimDiv.style.background = game.scrim;

      const topRow = document.createElement("div");
      topRow.className = "locked-top-row";

      const stageBadge = document.createElement("span");
      stageBadge.className = "stage-badge";
      stageBadge.textContent = game.stage;

      const lockPill = document.createElement("span");
      lockPill.className = "lock-pill";
      lockPill.textContent = "🔒 需密碼";

      topRow.append(stageBadge, lockPill);

      const mascotWrap = document.createElement("div");
      mascotWrap.className = "locked-mascot-wrap";
      const mascotImg = document.createElement("img");
      mascotImg.className = "locked-mascot";
      mascotImg.src = game.mascotImage;
      mascotImg.alt = "";
      mascotImg.draggable = false;
      mascotWrap.appendChild(mascotImg);

      const bottom = document.createElement("div");
      bottom.className = "locked-bottom";

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = game.title;

      const sub = document.createElement("p");
      sub.className = "card-sub";
      sub.textContent = game.themeLabel;

      const cta = document.createElement("span");
      cta.className = "card-cta-locked";
      cta.textContent = "🔑 輸入密碼開啟";

      bottom.append(title, sub, cta);
      card.append(bgDiv, scrimDiv, topRow, mascotWrap, bottom);

      card.addEventListener("click", () => {
        sfxTap();
        openPinModal(game, card);
      });

      lockedGrid.appendChild(card);
    });
  }

  // ---- 密碼彈窗控制（全程無狀態留存） ----
  function clearPinMemory() {
    for (let i = 0; i < pinDigits.length; i++) {
      pinDigits[i] = "";
    }
    pinDigits = [];
  }

  function resetDirectLaunch() {
    directLaunchLink.hidden = true;
    directLaunchLink.setAttribute("href", "#");
    confirmBtn.hidden = false;
    confirmBtnText.textContent = "確認解鎖並開啟";
  }

  function setFeedback(text, mode) {
    pinFeedbackEl.textContent = text || "";
    pinFeedbackEl.classList.remove("is-success", "is-loading");
    if (mode === "success") pinFeedbackEl.classList.add("is-success");
    if (mode === "loading") pinFeedbackEl.classList.add("is-loading");
  }

  function renderPinDots(stateClass, forceCount) {
    const count = typeof forceCount === "number" ? forceCount : pinDigits.length;
    pinDotsEl.innerHTML = "";
    pinDotsEl.classList.remove("is-flexible", "has-digits", "is-error", "is-success");

    if (isCloudMode) {
      // 雲端模式：支援 4～8 位任意純數字長度，改試算表位數免改網頁
      pinDotsEl.classList.add("is-flexible");
      if (count > 0) pinDotsEl.classList.add("has-digits");
      if (stateClass) pinDotsEl.classList.add(stateClass);

      if (count === 0) {
        const placeholder = document.createElement("span");
        placeholder.className = "pin-placeholder";
        placeholder.textContent = "請輸入 4～8 位數字密碼";
        pinDotsEl.appendChild(placeholder);
      } else {
        for (let i = 0; i < count; i++) {
          const pip = document.createElement("span");
          pip.className = "pin-pip";
          pinDotsEl.appendChild(pip);
        }
      }
      pinDotsEl.setAttribute("aria-label", `已輸入 ${count} 碼密碼`);
      confirmBtn.disabled = isLockedBusy || pinDigits.length < MIN_PIN_LEN;
    } else {
      // 本機離線模式：固定格數提示
      for (let i = 0; i < LOCAL_PIN_LEN; i++) {
        const dot = document.createElement("div");
        dot.className = "pin-dot";
        if (i < count) dot.classList.add("is-filled");
        if (stateClass) dot.classList.add(stateClass);
        pinDotsEl.appendChild(dot);
      }
      pinDotsEl.setAttribute("aria-label", `已輸入 ${count} 碼，共 ${LOCAL_PIN_LEN} 碼密碼`);
      confirmBtn.disabled = isLockedBusy || pinDigits.length < LOCAL_PIN_LEN;
    }
  }

  function openPinModal(game, triggerEl) {
    activeGame = game;
    lastFocusedTrigger = triggerEl || null;
    isLockedBusy = false;
    clearPinMemory();
    resetDirectLaunch();

    modalMascot.src = game.mascotImage;
    modalStageTag.textContent = "語文闖關・" + game.stage;
    modalStageTag.style.background = game.stageColor;
    modalGameTitle.textContent = game.title;
    modalGameSub.textContent = isCloudMode
      ? `請輸入密碼後按「確認解鎖」開啟「${game.stage}｜${game.title}」`
      : `請輸入 ${LOCAL_PIN_LEN} 位數密碼以開啟「${game.stage}｜${game.title}」`;
    setFeedback("", "");
    dialogEl.classList.remove("is-shaking");

    renderPinDots("");

    modalEl.hidden = false;
    modalEl.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      modalEl.classList.add("is-open");
    });
  }

  function closePinModal() {
    clearPinMemory();
    resetDirectLaunch();
    activeGame = null;
    isLockedBusy = false;
    setFeedback("", "");
    dialogEl.classList.remove("is-shaking");
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");

    setTimeout(() => {
      if (!modalEl.classList.contains("is-open")) {
        modalEl.hidden = true;
      }
    }, 180);

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  }

  function appendDigit(digit) {
    if (!activeGame || isLockedBusy) return;
    if (!/^[0-9]$/.test(digit)) return;
    if (pinDigits.length >= MAX_PIN_LEN) return;

    sfxTap();
    pinDigits.push(digit);
    setFeedback("", "");
    renderPinDots("");
  }

  function backspaceDigit() {
    if (!activeGame || isLockedBusy || pinDigits.length === 0) return;
    sfxTap();
    pinDigits.pop();
    setFeedback("", "");
    renderPinDots("");
  }

  function clearDigits() {
    if (!activeGame || isLockedBusy) return;
    sfxTap();
    clearPinMemory();
    setFeedback("", "");
    renderPinDots("");
  }

  function triggerShakeError(message, dotCount) {
    isLockedBusy = true;
    sfxError();
    setFeedback(message || "密碼不正確，請重新輸入", "");
    renderPinDots("is-error", dotCount);

    dialogEl.classList.remove("is-shaking");
    void dialogEl.offsetWidth;
    dialogEl.classList.add("is-shaking");

    setTimeout(() => {
      if (!activeGame) return;
      isLockedBusy = false;
      dialogEl.classList.remove("is-shaking");
      renderPinDots("");
    }, 520);
  }

  function handleUnlockSuccess(targetUrl, gameSnapshot, dotCount) {
    isLockedBusy = true;
    sfxSuccess();
    renderPinDots("is-success", dotCount);

    const opened = openInNewTab(targetUrl);
    if (opened) {
      setFeedback("密碼正確！正在為您開啟遊戲…", "success");
      setTimeout(() => {
        closePinModal();
        showToast("已在新分頁開啟遊戲，本次密碼未儲存。");
      }, 280);
    } else {
      // 若 iPad Safari 或嚴格瀏覽器攔截非同步開窗，直接提供一鍵開啟鈕
      setFeedback("密碼正確！請點下方按鈕立即開啟遊戲", "success");
      confirmBtn.hidden = true;
      directLaunchLink.setAttribute("href", targetUrl);
      directLaunchText.textContent = `驗證成功！點此開啟「${gameSnapshot.stage}｜${gameSnapshot.title}」▶`;
      directLaunchLink.hidden = false;
      directLaunchLink.focus();
    }
  }

  async function verifyViaCloud(gameId, pinAttempt) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), cloudTimeoutMs) : null;

    try {
      // 使用 text/plain 避開 Google Apps Script 不支援 CORS OPTIONS preflight 的限制
      const res = await fetch(cloudApiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "verify",
          gameId: gameId,
          pin: pinAttempt
        }),
        credentials: "omit",
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      });
      if (!res.ok) {
        throw new Error("HTTP_" + res.status);
      }
      return await res.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function attemptUnlock() {
    if (!activeGame || isLockedBusy) return;

    const minNeeded = isCloudMode ? MIN_PIN_LEN : LOCAL_PIN_LEN;
    if (pinDigits.length < minNeeded) {
      sfxError();
      setFeedback(
        isCloudMode
          ? `請輸入至少 ${MIN_PIN_LEN} 位數字密碼`
          : `請輸入完整的 ${LOCAL_PIN_LEN} 位數字密碼`,
        ""
      );
      return;
    }

    const gameSnapshot = activeGame;
    const enteredCount = pinDigits.length;
    const pinAttempt = pinDigits.join("");

    // 第一時間清除記憶體中的密碼陣列
    clearPinMemory();

    if (isCloudMode) {
      isLockedBusy = true;
      confirmBtn.disabled = true;
      confirmBtnText.textContent = "雲端驗證中…";
      setFeedback("⏳ 正在與雲端試算表驗證密碼…", "loading");
      renderPinDots("", enteredCount);

      try {
        const result = await verifyViaCloud(gameSnapshot.id, pinAttempt);
        // 若使用者在等待途中已關閉視窗，直接中止
        if (!activeGame || activeGame.id !== gameSnapshot.id) return;

        confirmBtnText.textContent = "確認解鎖並開啟";
        if (result && result.ok && typeof result.url === "string" && /^https?:\/\//i.test(result.url)) {
          handleUnlockSuccess(result.url, gameSnapshot, enteredCount);
        } else {
          triggerShakeError((result && result.message) || "密碼不正確，請重新輸入", enteredCount);
        }
      } catch (err) {
        if (!activeGame || activeGame.id !== gameSnapshot.id) return;
        confirmBtnText.textContent = "確認解鎖並開啟";
        const isTimeout = err && err.name === "AbortError";
        triggerShakeError(
          isTimeout ? "雲端回應逾時，請再試一次" : "無法連線至雲端驗證，請確認網路狀態",
          enteredCount
        );
      }
    } else {
      // 本機加密金庫模式（同步解密，立即開啟）
      const decryptedUrl =
        vaultApi && gameSnapshot.vault
          ? vaultApi.unlockUrl(pinAttempt, gameSnapshot.id, gameSnapshot.vault)
          : null;

      if (decryptedUrl) {
        handleUnlockSuccess(decryptedUrl, gameSnapshot, enteredCount);
      } else {
        triggerShakeError("密碼不正確，請重新輸入", enteredCount);
      }
    }
  }

  // ---- 事件綁定 ----
  keypadEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button.key-btn");
    if (!btn) return;
    const digit = btn.getAttribute("data-digit");
    const action = btn.getAttribute("data-action");
    if (digit !== null) {
      appendDigit(digit);
      if (!isCloudMode && pinDigits.length === LOCAL_PIN_LEN) {
        attemptUnlock();
      }
    } else if (action === "backspace") {
      backspaceDigit();
    } else if (action === "clear") {
      clearDigits();
    }
  });

  confirmBtn.addEventListener("click", attemptUnlock);

  directLaunchLink.addEventListener("click", () => {
    setTimeout(() => {
      closePinModal();
      showToast("已在新分頁開啟遊戲，本次密碼未儲存。");
    }, 80);
  });

  modalCloseBtn.addEventListener("click", () => {
    sfxTap();
    closePinModal();
  });

  modalEl.addEventListener("click", (ev) => {
    if (ev.target === modalEl) {
      closePinModal();
    }
  });

  // 支援電腦實體鍵盤輸入（無需任何原生 input 欄位）
  document.addEventListener("keydown", (ev) => {
    if (modalEl.hidden || !activeGame) return;

    if (ev.key >= "0" && ev.key <= "9") {
      ev.preventDefault();
      const visualBtn = keypadEl.querySelector(`[data-digit="${ev.key}"]`);
      if (visualBtn) {
        visualBtn.classList.add("is-pressed");
        setTimeout(() => visualBtn.classList.remove("is-pressed"), 110);
      }
      appendDigit(ev.key);
      if (!isCloudMode && pinDigits.length === LOCAL_PIN_LEN) {
        attemptUnlock();
      }
    } else if (ev.key === "Backspace") {
      ev.preventDefault();
      backspaceDigit();
    } else if (ev.key === "Delete") {
      ev.preventDefault();
      clearDigits();
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      attemptUnlock();
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      closePinModal();
    }
  });

  // 離開或切換分頁時主動清空記憶體中的未完成輸入
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !modalEl.hidden) {
      closePinModal();
    }
  });
  window.addEventListener("pagehide", clearPinMemory);

  // 右上音效鈕
  soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundBtn.setAttribute("aria-pressed", String(soundEnabled));
    soundBtn.querySelector(".util-icon").textContent = soundEnabled ? "🔊" : "🔇";
    soundBtn.querySelector(".util-text").textContent = soundEnabled ? "音效開" : "靜音";
    if (soundEnabled) sfxTap();
  });

  // 右上全螢幕鈕
  function syncFullscreenButton() {
    const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    fullscreenBtn.classList.toggle("is-active", isFs);
    fullscreenBtn.title = isFs ? "退出全螢幕" : "切換全螢幕";
    fullscreenBtn.setAttribute("aria-label", isFs ? "退出全螢幕" : "切換全螢幕");
  }

  fullscreenBtn.addEventListener("click", () => {
    sfxTap();
    const docEl = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    } else {
      (docEl.requestFullscreen || docEl.webkitRequestFullscreen || function () {}).call(docEl);
    }
  });

  document.addEventListener("fullscreenchange", syncFullscreenButton);
  document.addEventListener("webkitfullscreenchange", syncFullscreenButton);

  // ---- 啟動渲染 ----
  initHeader();
  renderOpenGames();
  renderLockedGames();
  syncFullscreenButton();
})();
