
import { db } from './db.js';
export async function computeCoverage(){
  const classes = await db.classes.toArray();
  const lessons = await db.lessons.toArray();
  const exercises = await db.exercises.toArray();
  // Aggregate BNCC by class (from lessons and exercises)
  const map = {};
  for(const c of classes){ map[c.id] = { name:c.nome, codes:new Set() }; }
  for(const l of lessons){ if(map[l.classId]) (l.objetivosBNCC||[]).forEach(cd=>map[l.classId].codes.add(cd)); }
  for(const e of exercises){ if(map[e.classId]) (e.bncc||[]).forEach(cd=>map[e.classId].codes.add(cd)); }
  // Count per subject domains
  function subjOf(code){ return /^EF\d+LP/.test(code) ? 'portugues' : /^EF\d+MA/.test(code) ? 'matematica' : 'outros'; }
  const out=[];
  for(const [id,obj] of Object.entries(map)){
    const per = { portugues:0, matematica:0, outros:0 };
    obj.codes.forEach(cd=>{ per[subjOf(cd)]++; });
    out.push({ classId:Number(id), name:obj.name, totals: per, codes: Array.from(obj.codes) });
  }
  return out;
}
export function renderBars(mount, data){
  // Simple canvas bars
  mount.innerHTML = '<canvas id=\"cov\" width=\"980\" height=\"240\"></canvas>';
  const c = mount.querySelector('#cov'); const ctx=c.getContext('2d');
  ctx.fillStyle='#e5e7eb'; ctx.font='14px sans-serif'; ctx.fillText('Cobertura BNCC (contagem de códigos citados em planos/exercícios)',10,20);
  const barW = Math.max(60, (c.width-40)/Math.max(1,data.length)/1.2);
  data.forEach((d,i)=>{
    const x = 20+i*barW*1.2; const vals=[d.totals.portugues, d.totals.matematica]; const max = Math.max(1, Math.max(...vals));
    ['#60a5fa','#f472b6'].forEach((col,idx)=>{
      const h = (vals[idx]/max)*160; ctx.fillStyle=col; ctx.fillRect(x+idx*(barW/2+6), 200-h, barW/2, h); 
    });
    ctx.fillStyle='#9ca3af'; ctx.fillText(d.name, x, 220);
  });
}
