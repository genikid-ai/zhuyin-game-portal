/* ==========================================================================
   無痕加密金庫模組（Pure-JS SHA-256 + 迭代金鑰衍生 + CTR 串流解密 + MAC 驗證）
   - 支援本機 file:/// 與線上 HTTPS（不依賴僅限 Secure Context 的 crypto.subtle）
   - 絕不讀寫 localStorage / sessionStorage / cookie
   - 採同步運算，讓解鎖後的 window.open 保留在使用者點擊事件內，不被瀏覽器擋彈窗
   ========================================================================== */
(function (global) {
  "use strict";

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  function utf8Encode(str) {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(str);
    }
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) {
        bytes.push(c);
      } else if (c < 0x800) {
        bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        const c2 = str.charCodeAt(++i);
        const cp = 0x10000 + (((c & 0x3ff) << 10) | (c2 & 0x3ff));
        bytes.push(
          0xf0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3f),
          0x80 | ((cp >> 6) & 0x3f),
          0x80 | (cp & 0x3f)
        );
      } else {
        bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return new Uint8Array(bytes);
  }

  function utf8Decode(bytes) {
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      out += String.fromCharCode(bytes[i]);
    }
    return decodeURIComponent(escape(out));
  }

  function sha256Bytes(inputBytes) {
    const len = inputBytes.length;
    const bitLenHi = Math.floor((len * 8) / 0x100000000);
    const bitLenLo = (len * 8) >>> 0;

    const padLen = ((len + 9 + 63) >> 6) << 6;
    const padded = new Uint8Array(padLen);
    padded.set(inputBytes);
    padded[len] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(padLen - 8, bitLenHi, false);
    view.setUint32(padLen - 4, bitLenLo, false);

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const w = new Uint32Array(64);

    for (let offset = 0; offset < padLen; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = view.getUint32(offset + i * 4, false);
      }
      for (let i = 16; i < 64; i++) {
        const s0 = ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^ ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^ (w[i - 15] >>> 3);
        const s1 = ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^ ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;

        h = g; g = f; f = e;
        e = (d + temp1) >>> 0;
        d = c; c = b; b = a;
        a = (temp1 + temp2) >>> 0;
      }

      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
      h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0;
      h7 = (h7 + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
  }

  function bytesToHex(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  function hexToBytes(hex) {
    if (typeof hex !== "string" || hex.length % 2 !== 0) {
      throw new Error("Invalid hex payload");
    }
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  function sha256Hex(str) {
    return bytesToHex(sha256Bytes(utf8Encode(str)));
  }

  function constantTimeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  function deriveKeyHex(pin, saltHex, itemId, rounds) {
    const iter = Number.isInteger(rounds) && rounds > 0 ? rounds : 2000;
    let state = sha256Bytes(utf8Encode(saltHex + ":" + pin + ":" + itemId));
    for (let i = 1; i < iter; i++) {
      state = sha256Bytes(state);
    }
    return bytesToHex(state);
  }

  function xorStream(dataBytes, keyHex, saltHex) {
    const out = new Uint8Array(dataBytes.length);
    let blockIndex = 0;
    let offset = 0;
    while (offset < dataBytes.length) {
      const mask = sha256Bytes(utf8Encode(keyHex + ":stream:" + saltHex + ":" + blockIndex));
      const chunk = Math.min(32, dataBytes.length - offset);
      for (let i = 0; i < chunk; i++) {
        out[offset + i] = dataBytes[offset + i] ^ mask[i];
      }
      offset += chunk;
      blockIndex++;
    }
    return out;
  }

  function computeMacHex(keyHex, saltHex, itemId, cipherHex) {
    return sha256Hex(keyHex + ":mac:" + saltHex + ":" + itemId + ":" + cipherHex);
  }

  function unlockUrl(pin, itemId, vault) {
    if (!vault || !vault.salt || !vault.cipher || !vault.mac) {
      return null;
    }
    const keyHex = deriveKeyHex(String(pin), vault.salt, itemId, vault.rounds);
    const expectedMac = computeMacHex(keyHex, vault.salt, itemId, vault.cipher);
    if (!constantTimeEqual(expectedMac, vault.mac)) {
      return null;
    }
    try {
      const cipherBytes = hexToBytes(vault.cipher);
      const plainBytes = xorStream(cipherBytes, keyHex, vault.salt);
      const url = utf8Decode(plainBytes);
      if (/^(https?:\/\/|\.\.?\/)/i.test(url)) {
        return url;
      }
      return null;
    } catch (_err) {
      return null;
    }
  }

  function sealUrl(pin, itemId, url, saltHex, rounds) {
    const iter = Number.isInteger(rounds) && rounds > 0 ? rounds : 2000;
    const keyHex = deriveKeyHex(String(pin), saltHex, itemId, iter);
    const cipherBytes = xorStream(utf8Encode(url), keyHex, saltHex);
    const cipherHex = bytesToHex(cipherBytes);
    const macHex = computeMacHex(keyHex, saltHex, itemId, cipherHex);
    return { salt: saltHex, rounds: iter, cipher: cipherHex, mac: macHex };
  }

  global.PortalVault = Object.freeze({
    unlockUrl,
    sealUrl
  });
})(window);
