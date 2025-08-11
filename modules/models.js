
const KEY='maelly:templates';
export function listTemplates(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
export function addTemplate(t){ const arr=listTemplates(); arr.unshift({...t, id: Date.now()}); localStorage.setItem(KEY, JSON.stringify(arr)); }
export function getTemplate(id){ return listTemplates().find(x=>String(x.id)===String(id)); }
