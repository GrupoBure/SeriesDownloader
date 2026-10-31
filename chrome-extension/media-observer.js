"use strict";
// Observación pasiva del reproductor: no altera el video ni sus solicitudes.
const seen = new Set();
function inspect(url) {
  if (typeof url !== "string" || seen.has(url)) return;
  let u;try {u=new URL(url);} catch {return;}
  if (u.protocol!=="https:" || !u.pathname.toLowerCase().endsWith(".m3u8")) return;
  if (u.hostname!=="masdramas.com" && !u.hostname.endsWith(".hotplot.vip")) return;
  seen.add(url);
  chrome.runtime.sendMessage({type:"MEDIA_FOUND",url:u.href},()=>{void chrome.runtime.lastError;});
}
function scan(){for(const e of performance.getEntriesByType("resource"))inspect(e.name);}
try {
  new PerformanceObserver(list=>{for(const e of list.getEntries())inspect(e.name);}).observe({type:"resource",buffered:true});
  scan();
} catch(e) {console.debug("[Series Downloader] PerformanceObserver no disponible",e);}
