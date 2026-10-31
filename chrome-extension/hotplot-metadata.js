"use strict";
// Solo lee el encabezado visible del episodio que el usuario abrió.
let reported=false;
function collect() {
  if (reported) return;
  const headings=[...document.querySelectorAll("h1")].map(h=>h.textContent.trim());
  const value=headings.find(s=>/Episode\s*\d+/i.test(s))||"";
  const match=value.match(/Episode\s*(\d+)\s*[·:|\-]\s*(.+)/i);
  if (!match) return;
  const number=Number(match[1]);
  const series=match[2].normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
  if (!Number.isInteger(number)||number<1||number>999||!series) return;
  reported=true;
  chrome.runtime.sendMessage({type:"EPISODE_META",number,series},()=>{void chrome.runtime.lastError;});
}
collect();
const observer=new MutationObserver(()=>{collect();if(reported)observer.disconnect();});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>observer.disconnect(),15000);
