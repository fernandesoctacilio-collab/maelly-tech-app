
const KEY='maelly:bnccFav';
export function getFavs(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
export function addFav(code){ const s=new Set(getFavs()); s.add(code); localStorage.setItem(KEY, JSON.stringify([...s])); }
export function removeFav(code){ const a=getFavs().filter(c=>c!==code); localStorage.setItem(KEY, JSON.stringify(a)); }
