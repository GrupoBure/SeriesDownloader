"use strict";
// HotPlot usa dos formatos: "Episode 1 · Título" y "Título · EP1".
let reported=false;
function readMetadata(value) {
  const clean=(value||"").replace(/\s*\|\s*Free Short Dramas[\s\S]*$/i,"").trim();
  let number, title;
  let match=clean.match(/^(?:Episode|Episodio|Ep\.?)[\s#]*(\d+)\s*[·:|\-–]\s*(.+)$/i);
  if(match){number=Number(match[1]);title=match[2];}
  else {
    match=clean.match(/^(.+?)\s*[·:|\-–]\s*(?:Episode|Episodio|Ep\.?)\s*#?(\d+)\s*$/i);
    if(!match)return null;
    title=match[1];number=Number(match[2]);
  }
  const series=title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
  return Number.isInteger(number)&&number>=1&&number<=999&&series?{number,series}:null;
}
function collect() {
  if (reported) return;
  const candidates=[...document.querySelectorAll('h1, meta[property="og:title"], meta[name="twitter:title"]')].map(el=>el.content||el.textContent||"");
  candidates.push(document.title||"");
  const meta=candidates.map(readMetadata).find(Boolean);
  if(!meta)return;
  reported=true;
  chrome.runtime.sendMessage({type:"EPISODE_META",...meta},()=>{void chrome.runtime.lastError;});
}
collect();
const observer=new MutationObserver(()=>{collect();if(reported)observer.disconnect();});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>observer.disconnect(),15000);
