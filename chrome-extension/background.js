"use strict";
const ORIGIN = "https://grupobure.github.io/SeriesDownloader/";
const TTL_MS = 2 * 60 * 1000;
const KEY = id => "episode_" + id;
function report(tabId, payload) {chrome.tabs.sendMessage(tabId, payload, () => {void chrome.runtime.lastError;});}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === "EPISODE_META" && Number.isInteger(sender.tab?.id) && sender.url?.startsWith("https://hotplot.ai/")) {
    void (async()=>{
      const session=(await chrome.storage.session.get(KEY(sender.tab.id)))[KEY(sender.tab.id)];
      if(session){report(session.sourceTabId,{type:"META",requestId:session.requestId,number:message.number,series:message.series});if(session.captured){await chrome.storage.session.remove(KEY(sender.tab.id));await chrome.alarms.clear(KEY(sender.tab.id));}else await chrome.storage.session.set({[KEY(sender.tab.id)]:{...session,metaDelivered:true}});}
    })().catch(error=>console.error("[Series Downloader] Metadatos HotPlot",error));
    return;
  }
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
      console.info("[Series Downloader] Detección iniciada", {tabId:id,site:page.hostname});
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
    let parsed;try {parsed=new URL(details.url);} catch {return;}
    if (parsed.protocol!=="https:" || !parsed.pathname.toLowerCase().endsWith(".m3u8")) return;
    if (!(parsed.hostname==="masdramas.com" || parsed.hostname.endsWith(".hotplot.vip"))) return;
    let key=KEY(details.tabId);
    let session=(await chrome.storage.session.get(key))[key];
    if (!session && details.tabId===-1) {
      // Algunas solicitudes emitidas por workers no llevan tabId. Solo
      // asociarlas si existe exactamente una detección pendiente del sitio.
      const initiator=details.initiator||"";
      const matchingOrigin=(parsed.hostname==="masdramas.com" && initiator==="https://masdramas.com") ||
        (parsed.hostname.endsWith(".hotplot.vip") && initiator==="https://hotplot.ai");
      if (matchingOrigin) {
        const stored=await chrome.storage.session.get(null);
        const pending=Object.entries(stored).filter(([k,v])=>k.startsWith("episode_")&&v&&Date.now()-v.created<TTL_MS);
        if (pending.length===1) {[key,session]=pending[0];}
      }
    }
    console.info("[Series Downloader] Solicitud HLS",{host:parsed.hostname,tabId:details.tabId,initiator:details.initiator,asociada:!!session});
    if (!session || session.captured || Date.now()-session.created>TTL_MS) return;
    if (parsed.hostname==="masdramas.com" && /\/s3hls\/[012]\.m3u8$/i.test(parsed.pathname)) {
      parsed.pathname=parsed.pathname.replace(/\/s3hls\/[012]\.m3u8$/i,"/s3hls/2.m3u8");
    }
    if(parsed.hostname.endsWith(".hotplot.vip")&&!session.metaDelivered){await chrome.storage.session.set({[key]:{...session,captured:true}});}else{await chrome.storage.session.remove(key);await chrome.alarms.clear(key);}
    console.info("[Series Downloader] Video identificado, enviando a la página");
    report(session.sourceTabId,{type:"CAPTURED",requestId:session.requestId,url:parsed.href});
  })().catch(error=>console.error("[Series Downloader] Error de detección",error));
},{urls:["https://masdramas.com/*","https://*.hotplot.vip/*"]});
chrome.alarms.onAlarm.addListener(async alarm => {
  if (!alarm.name.startsWith("episode_")) return;
  const session=(await chrome.storage.session.get(alarm.name))[alarm.name];
  if (!session) return;
  await chrome.storage.session.remove(alarm.name);
  report(session.sourceTabId,{type:"FAILED",requestId:session.requestId,reason:session.captured?"El video se detectó, pero no se pudo leer el número de episodio. Indícalo manualmente.":"Pasaron dos minutos sin detectar la lista HLS. Comprueba que el video se reproduzca."});
});
chrome.tabs.onRemoved.addListener(async tabId => {
  const key=KEY(tabId);
  const session=(await chrome.storage.session.get(key))[key];
  if (!session) return;
  await chrome.storage.session.remove(key);
  await chrome.alarms.clear(key);
  if(!session.captured)report(session.sourceTabId,{type:"FAILED",requestId:session.requestId,reason:"Cerraste el capítulo antes de detectar video"});
});
