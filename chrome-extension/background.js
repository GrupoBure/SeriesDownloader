"use strict";
const active = new Map();
const MAX_WAIT_MS = 10 * 60 * 1000;
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "START") return;
  const sourceTabId = sender.tab?.id;
  if (!Number.isInteger(sourceTabId) || sender.url?.split(/[?#]/)[0] !== "https://grupobure.github.io/SeriesDownloader/") {respond({ok: false, error: "Página de origen no autorizada"}); return;}
  chrome.tabs.create({url: message.url, active: true}, (tab) => {
    if (chrome.runtime.lastError || !Number.isInteger(tab?.id)) {respond({ok: false, error: "Chrome no pudo abrir la pestaña"}); return;}
    active.set(tab.id, {sourceTabId, requestId: message.requestId, created: Date.now()});
    respond({ok: true});
  });
  return true;
});
chrome.webRequest.onBeforeRequest.addListener((details) => {
  const session = active.get(details.tabId);
  if (!session) return;
  if (Date.now() - session.created > MAX_WAIT_MS) {active.delete(details.tabId); return;}
  let parsed; try {parsed = new URL(details.url);} catch {return;}
  if (parsed.protocol !== "https:" || !parsed.pathname.toLowerCase().endsWith(".m3u8")) return;
  if (!(parsed.hostname === "masdramas.com" || parsed.hostname.endsWith(".hotplot.vip"))) return;
  active.delete(details.tabId);
  chrome.tabs.sendMessage(session.sourceTabId, {type: "CAPTURED", requestId: session.requestId, url: parsed.href}, () => {void chrome.runtime.lastError;});
}, {urls: ["https://masdramas.com/*", "https://*.hotplot.vip/*"]});
chrome.tabs.onRemoved.addListener((tabId) => {
  const session = active.get(tabId); if (!session) return;
  active.delete(tabId);
  chrome.tabs.sendMessage(session.sourceTabId, {type: "FAILED", requestId: session.requestId, reason: "Cerraste el capítulo antes de detectar video"}, () => {void chrome.runtime.lastError;});
});
