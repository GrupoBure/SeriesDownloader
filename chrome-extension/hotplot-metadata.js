"use strict";
// HotPlot usa dos formatos: "Episode 1 · Título" y "Título · EP1".
let reported=false;
let catalogReported=false;
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
  if(!reported){
    const candidates=[...document.querySelectorAll('h1, meta[property="og:title"], meta[name="twitter:title"]')].map(el=>el.content||el.textContent||"");
    candidates.push(document.title||"");
    const meta=candidates.map(readMetadata).find(Boolean);
    if(meta){reported=true;chrome.runtime.sendMessage({type:"EPISODE_META",...meta},()=>{void chrome.runtime.lastError;});}
  }
  if(catalogReported)return;
  // Next.js incluye la lista pública de episodios y su estado de acceso en el HTML.
  // Nunca se solicitan ni reconstruyen transmisiones de episodios bloqueados.
  for(const script of document.querySelectorAll('script')){
    const source=(script.textContent||"").replace(/\\"/g,'"');
    const list=source.match(/"episodes":\[([\s\S]*?)\],"show":\{/);
    if(!list)continue;
    const entries=[...list[1].matchAll(/"id":"([a-f0-9-]{36})","no":(\d+),"title":"[^"]*","access":"([A-Z_]+)","has_media":(true|false),"state":"([A-Z_]+)"/g)]
      .map(x=>({id:x[1],n:Number(x[2]),access:x[3],hasMedia:x[4]==='true',state:x[5]}))
      .filter(x=>Number.isInteger(x.n)&&x.n>=1&&x.n<=999);
    if(!entries.length)continue;
    catalogReported=true;
    const title=(document.querySelector('meta[property="og:title"]')?.content||document.title||'').replace(/\s*[·:|\-–]\s*(?:EP|Episode|Episodio)\s*#?\d+[\s\S]*$/i,'').trim();
    const series=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
    chrome.runtime.sendMessage({type:'EPISODE_CATALOG',series,episodes:entries},()=>{void chrome.runtime.lastError;});
    break;
  }
}
collect();
const observer=new MutationObserver(()=>{collect();if(reported&&catalogReported)observer.disconnect();});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>observer.disconnect(),15000);
