
let index=null, base=[];
export async function ensureBNCC(){
  if(index) return;
  const res = await fetch('data/bncc.json'); base = await res.json();
  index = new MiniSearch({ fields:['codigo','descricao','componente'], storeFields:['codigo','descricao','componente','etapa'] });
  index.addAll(base);
}
export async function searchBNCC(q){
  await ensureBNCC();
  if(!q || !q.trim()) return [];
  return index.search(q, { prefix:true, fuzzy:0.2 }).slice(0,30);
}
export function codesToChips(codes){ return codes.map(c=>`<span class="badge">${c}</span>`).join(' '); }
