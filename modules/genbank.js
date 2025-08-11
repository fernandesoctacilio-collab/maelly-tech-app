
// Banco gerador alinhado à BNCC com dificuldade e modelos com imagem
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---- Helpers de imagens via canvas ----
function canvasURL(w,h, draw){
  const c = typeof OffscreenCanvas!=='undefined' ? new OffscreenCanvas(w,h) : document.createElement('canvas');
  c.width=w; c.height=h; const ctx=c.getContext('2d');
  draw(ctx,w,h);
  return (c.convertToBlob? c.convertToBlob({type:'image/jpeg', quality:0.92}).then(b=>new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(b);}))
                       : new Promise(res=>res(c.toDataURL('image/jpeg',0.92))));
}
async function fracImage(n,d){
  return canvasURL(640, 380, (ctx,w,h)=>{
    ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,w,h);
    const cols = d, rows = 1; const pad=20, cw=(w-2*pad)/cols, ch=(h-2*pad)/rows;
    for(let c=0;c<cols;c++){ ctx.fillStyle = c<n ? '#60a5fa' : '#111827'; ctx.strokeStyle='#374151';
      ctx.fillRect(pad+c*cw+2, pad+2, cw-4, ch-4); ctx.strokeRect(pad+c*cw+2, pad+2, cw-4, ch-4); }
    ctx.fillStyle='#e5e7eb'; ctx.font='20px sans-serif'; ctx.fillText(`${n}/${d}`, pad, h-16);
  });
}
async function rectPerimeterImage(wu,hu){
  return canvasURL(640, 380, (ctx,w,h)=>{
    ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,w,h);
    const pad=60; const ww=w-2*pad, hh=h-2*pad;
    ctx.strokeStyle='#60a5fa'; ctx.lineWidth=4; ctx.strokeRect(pad, pad, ww, hh);
    ctx.fillStyle='#e5e7eb'; ctx.font='20px sans-serif';
    ctx.fillText(`${wu} cm`, pad+ww/2-20, pad-10); ctx.fillText(`${hu} cm`, pad-50, pad+hh/2);
  });
}
async function clockImage(hh,mm){
  return canvasURL(380, 380, (ctx,w,h)=>{
    ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,w,h);
    const cx=w/2, cy=h/2, r=150; ctx.strokeStyle='#60a5fa'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    // marcas
    ctx.lineWidth=2; for(let i=0;i<12;i++){ const a=i*Math.PI/6; const x1=cx+Math.cos(a)*(r-12), y1=cy+Math.sin(a)*(r-12); const x2=cx+Math.cos(a)*r, y2=cy+Math.sin(a)*r; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    // ponteiros
    const ah=(hh%12+mm/60)*Math.PI/6, am=mm*Math.PI/30;
    ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ah)*(r-60), cy+Math.sin(ah)*(r-60)); ctx.stroke();
    ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(am)*(r-30), cy+Math.sin(am)*(r-30)); ctx.stroke();
  });
}

// ---- Dificuldade -> ranges ----
function levelRanges(diff){
  if(diff==='dificil') return { add:[200,900], sub:[200,900], mul:[7,12], div:[7,12], frac:[6,10], peri:[8,20] };
  if(diff==='medio')   return { add:[100,300], sub:[100,300], mul:[4,9], div:[4,9], frac:[4,8],  peri:[5,15] };
  return { add:[10,100], sub:[10,100], mul:[2,6], div:[2,6], frac:[2,6], peri:[3,10] }; // facil
}
function gerarOperacao(op,a,b){
  if(op==='add') return {en:`Quanto é ${a}+${b}?`, val:a+b};
  if(op==='sub') return {en:`Quanto é ${a}-${b}?`, val:a-b};
  if(op==='mul') return {en:`Quanto é ${a}×${b}?`, val:a*b};
  if(op==='div') return {en:`Quanto é ${a*b}÷${b}?`, val:a};
}

// ------- Português -------
function textoCurto(){
  const nomes = ['Lia','Ravi','Noa','Beto','Iris','Davi'];
  const locs = ['na biblioteca','no pátio','na sala de aula','no corredor'];
  const atos = ['achou um livro de mistério','fez um cartaz de reciclagem','organizou os lápis'];
  return `${pick(nomes)} ${pick(atos)} ${pick(locs)}. Depois, contou a novidade aos colegas. Todos ajudaram e foi um sucesso.`;
}
const PT={
  EF02LP01:(tema,diff)=>[{ tipo:'multipla', enunciado:`${textoCurto()} Sobre o texto, o que aconteceu primeiro?`, alternativas:[
      'O personagem contou a novidade.','Todos ajudaram.','O personagem encontrou algo/começou a atividade.','A turma comemorou na hora.'
    ], correta:2 }],
  EF02LP02:(tema,diff)=>[{ tipo:'multipla', enunciado:`${textoCurto()} Quem contou a novidade aos colegas?`, alternativas:['O diretor','Um responsável','O personagem principal','Ninguém'], correta:2 }],
  EF02LP03:(tema,diff)=>{
    const alvo = pick(['casa','bola','pato','mala']); const rimas = { casa:['asa','brasa','vasa','mesa'], bola:['escola','rola','tola','cola'], pato:['gato','prato','rato','tato'], mala:['sala','pala','ala','fala'] };
    const alts = rimas[alvo] || ['asa','brasa','vasa','mesa'];
    return [{ tipo:'multipla', enunciado:`Qual palavra rima com "${alvo}"?`, alternativas: alts, correta:0 }];
  },
  EF02LP05:(tema,diff)=>[{ tipo:'multipla', enunciado:`${textoCurto()} Onde acontece a história?`, alternativas:['Na praia','No pátio ou sala da escola','No cinema','Em casa'], correta:1 }],
  EF02LP06:(tema,diff)=>[{ tipo:'lacuna', enunciado:`No texto, a ideia central é: ________ (complete em 3 a 5 palavras).`, correta:'' }],

  EF05LP02:(tema,diff)=>[{ tipo:'multipla', enunciado:`${textoCurto()} O que podemos inferir?`, alternativas:[
      'Ninguém ajudou.','A atividade envolveu cooperação.','O diretor proibiu a ação.','O personagem não contou nada.'
    ], correta:1 }],
  EF05LP03:(tema,diff)=>[{ tipo:'multipla', enunciado:`Em "Depois, contou a novidade aos colegas.", o conector "depois" indica:`, alternativas:[
      'Causa','Tempo/Sequência','Condição','Contraste'
    ], correta:1 }],
  EF05LP21:(tema,diff)=>[{ tipo:'lacuna', enunciado:`Escreva um breve parágrafo (3-4 frases) com início, meio e fim sobre "${tema||'um dia na escola'}".`, correta:'' }],
  EF15LP16:(tema,diff)=>[{ tipo:'vf', enunciado:`${textoCurto()} A afirmação: "O personagem compartilhou o que aconteceu" é`, correta:true }],
};

// ------- Matemática -------
const MT={
  EF02MA04:(tema,diff)=>[{ tipo:'multipla', enunciado:`Qual número é MAIOR?`, alternativas:['178','187','170','167'], correta:1 }],
  EF02MA07:(tema,diff)=>{
    const r = levelRanges(diff);
    const a=rnd(r.add[0],r.add[1]), b=rnd(10, r.add[0]//2);
    const isAdd=Math.random()>.5; const op=isAdd?'add':'sub'; const g=gerarOperacao(op,a,b);
    const ans=g.val; const alts=[ans, ans+1, ans-1, ans+(isAdd?2:-2)].sort(()=>Math.random()-0.5).map(String);
    return [{ tipo:'multipla', enunciado:g.en, alternativas:alts, correta:alts.indexOf(String(ans)) }];
  },
  EF02MA12:async(tema,diff)=>{
    const hh = rnd(7,11), mm = pick([0,30]);
    const dataUrl = await clockImage(hh, mm);
    return [{ tipo:'multipla', enunciado:`Que horas o relógio marca?`, alternativas:[`${hh}:00`, `${hh}:${mm===0?'15':'30'}`, `${hh}:${mm===0?'30':'00'}`, `${hh+1}:00`], correta: mm===0?0:2, imagemDataUrl: dataUrl }];
  },

  EF05MA05:(tema,diff)=>[{ tipo:'multipla', enunciado:`Qual é múltiplo de 6?`, alternativas:['14','18','22','25'], correta:1 }],
  EF05MA07:(tema,diff)=>{
    const r = levelRanges(diff); const a=rnd(r.mul[0],r.mul[1]), b=rnd(r.mul[0],r.mul[1]);
    const g=gerarOperacao('mul',a,b); const ans=g.val; const alts=[ans, ans+a, ans-a, ans+1].sort(()=>Math.random()-0.5).map(String);
    return [{ tipo:'multipla', enunciado:g.en, alternativas:alts, correta:alts.indexOf(String(ans)) }];
  },
  EF05MA08:async(tema,diff)=>{
    const r=levelRanges(diff); const d=rnd(Math.max(2,r.frac[0]), r.frac[1]); const n=rnd(1, d-1);
    const url = await fracImage(n,d);
    return [{ tipo:'lacuna', enunciado:`A figura mostra uma fração. Escreva a fração pintada: ___/${d}`, correta:String(n), imagemDataUrl: url }];
  },
  EF05MA09:(tema,diff)=>[{ tipo:'multipla', enunciado:`Qual é maior?`, alternativas:['2/5','3/5','1/5','4/5'], correta:3 }],
  EF05MA22:async(tema,diff)=>{
    const r=levelRanges(diff); const w=rnd(r.peri[0], r.peri[1]), h=rnd(r.peri[0], r.peri[1]);
    const url = await rectPerimeterImage(w,h);
    return [{ tipo:'lacuna', enunciado:`Observe a figura e calcule o perímetro do retângulo. ______ cm`, correta:String(2*(w+h)), imagemDataUrl: url }];
  },
};

export function listBnccBy(subject, year){
  const map = (subject==='portugues')?{
    '2º ano': ['EF02LP01','EF02LP02','EF02LP03','EF02LP05','EF02LP06'],
    '5º ano': ['EF05LP02','EF05LP03','EF05LP21','EF15LP16']
  }:{
    '2º ano': ['EF02MA04','EF02MA07','EF02MA12'],
    '5º ano': ['EF05MA05','EF05MA07','EF05MA08','EF05MA09','EF05MA22']
  };
  return map[year] || [];
}

export async function generateByBNCC({ subject, year, code, theme, quantity=6, difficulty='facil' }){
  const bank = subject==='portugues' ? PT : MT;
  const fn = bank[code];
  if(!fn) return [];
  const out=[];
  for(let i=0;i<quantity;i++){
    const item = await fn(theme, difficulty);
    // fn pode retornar array ou item; normalizar
    const it = Array.isArray(item)? item[0] : item;
    out.push(it);
  }
  return out;
}
