"use strict";
const ORIGIN = "https://grupobure.github.io/SeriesDownloader/";
const TTL_MS = 2 * 60 * 1000;
const KEY = id => "episode_" + id;
function report(tabId, payload) {chrome.tabs.sendMessage(tabId, payload, () => {void chrome.runtime.lastError;});}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "START") return;
  if (!Number.isInteger(sender.tab?.id) || sender.url?.split(/[?#]/)[0] !== ORIGIN) {
    respond({ok:false,error:"Página de origen no autorizada"});return;
  }
  let page;
  try {page = new URL(message.url);} catch {respond({ok:false,error:"Enlace inválido"});return;}
  if (page.protocol !== "https:" || !["masdramas.com","hotplot.ai"].includes(page.hostname)) {
    respond({ok:false,error:"Sitio no compatible"});return;
  }
  // Primero registrar la pestaña y después navegar: Chrome puede pedir el HLS
  // antes del callback de tabs.create cuando se navega directamente.
  chrome.tabs.create({url:"about:blank",active:true}, async tab => {
    if (chrome.runtime.lastError || !Number.isInteger(tab?.id)) {
      respond({ok:false,error:"Chrome no pudo abrir la pestaña"});return;
    }
    const id=tab.id;
    try {
      await chrome.storage.session.set({[KEY(id)]:{sourceTabId:sender.tab.id,requestId:message.requestId,created:Date.now()}});
      await chrome.alarms.create(KEY(id),{delayInMinutes:TTL_MS/60000});
      await chrome.tabs.update(id,{url:page.href});
      respond({ok:true});
    } catch(e) {
      await chrome.storage.session.remove(KEY(id));
      respond({ok:false,error:"No se pudo iniciar la detección: "+String(e.message||e)});
    }
  });
  return true;
});
chrome.webRequest.onBeforeRequest.addListener(details => {
  void (async () => {
    const key=KEY(details.tabId);
    const session=(await chrome.storage.session.get(key))[key];
    if (!session || Date.now()-session.created>TTL_MS) return;
    let parsed;try {parsed=new URL(details.url);} catch {return;}
    if (parsed.protocol!=="https:" || !parsed.pathname.toLowerCase().endsWith(".m3u8")) return;
    if (!(parsed.hostname==="masdramas.com" || parsed.hostname.endsWith(".hotplot.vip"))) return;
    if (parsed.hostname==="masdramas.com" && /\/s3hls\/[012]\.m3u8$/i.test(parsed.pathname)) {
      parsed.pathname=parsed.pathname.replace(/\/s3hls\/[012]\.m3u8$/i,"/s3hls/2.m3u8");
    }
    await chrome.storage.session.remove(key);
    await chrome.alarms.clear(key);
    report(session.sourceTabId,{type:"CAPTURED",requestId:session.requestId,url:parsed.href});
  })().catch(()=>{});
},{urls:["https://masdramas.com/*","https://*.hotplot.vip/*"]});
chrome.alarms.onAlarm.addListener(async alarm => {
  if (!alarm.name.startsWith("episode_")) return;
  const session=(await chrome.storage.session.get(alarm.name))[alarm.name];
  if (!session) return;
  await chrome.storage.session.remove(alarm.name);
  report(session.sourceTabId,{type:"FAILED",requestId:session.requestId,reason:"Pasaron dos minutos sin detectar la lista HLS. Comprueba que el video se reproduzca."});
});
chrome.tabs.onRemoved.addListener(async tabId => {
  const key=KEY(tabId);
  const session=(await chrome.storage.session.get(key))[key];
  if (!session) return;
  await chrome.storage.session.remove(key);
  await chrome.alarms.clear(key);
  report(session.sourceTabId,{type:"FAILED",requestId:session.requestId,reason:"Cerraste el capítulo antes de detectar video"});
});
