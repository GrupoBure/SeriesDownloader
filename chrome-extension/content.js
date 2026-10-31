"use strict";
const CHANNEL_PAGE = "SERIES_DOWNLOADER_PAGE";
const CHANNEL_EXTENSION = "SERIES_DOWNLOADER_EXTENSION";
function report(message) { window.postMessage({channel: CHANNEL_EXTENSION, ...message}, location.origin); }
window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== location.origin || event.data?.channel !== CHANNEL_PAGE || event.data?.type !== "START") return;
  const {url, requestId} = event.data;
  if (typeof requestId !== "string" || requestId.length > 100 || typeof url !== "string") return;
  let target; try { target = new URL(url); } catch { return; }
  const allowed = target.protocol === "https:" && ((target.hostname === "masdramas.com" && /^\/series\/[a-z0-9-]+\/episodio-\d+\/?$/.test(target.pathname)) || (target.hostname === "hotplot.ai" && /^\/[a-zA-Z-]+\/watch\/[a-f0-9-]+\/?$/.test(target.pathname)));
  if (!allowed) { report({type: "FAILED", requestId, reason: "Sitio no compatible"}); return; }
  chrome.runtime.sendMessage({type: "START", url: target.href, requestId}, (response) => {
    if (chrome.runtime.lastError || !response?.ok) report({type: "FAILED", requestId, reason: response?.error || "No se pudo abrir el capítulo"});
  });
});
chrome.runtime.onMessage.addListener((message) => { if (message?.type === "CAPTURED" || message?.type === "FAILED") report(message); });
report({type: "READY"});
document.addEventListener("DOMContentLoaded", () => report({type: "READY"}), {once: true});
