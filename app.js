
import { db, addClass, listClasses, addStudent, listStudentsByClass, dumpAll, restoreDump } from './modules/db.js';
import { encryptJSON, decryptToJSON } from './modules/crypto.js';
import { searchBNCC, codesToChips } from './modules/bncc.js';

const $ = s=>document.querySelector(s);

// Helpers
const debounce=(fn,wait=300)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait)};}
const memoryCache=new Map();
const cacheGet=async(key,fetcher,ttl=5*60*1000)=>{
  const hit=memoryCache.get(key);
  if(hit && (Date.now()-hit.ts)<ttl) return hit.val;
  const val=await fetcher();
  memoryCache.set(key,{ts:Date.now(),val});
  return val;
};
const showToast=(m)=>{const t=$('#toast');t.textContent=m;t.classList.add('show');t.style.display='block';setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.style.display='none',200)},2200);};

// SW
if('serviceWorker' in navigator){ window.addEventListener('load', async ()=>{ try{ const reg=await navigator.serviceWorker.register('sw.js'); $('#btn-check-updates').addEventListener('click',()=>{ reg.update(); showToast('Checando atualizações...'); }); } catch(e){ console.warn('SW', e); } }); }
let deferred=null; window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferred=e; $('#btn-install').style.display='inline-block'; }); $('#btn-install').addEventListener('click',async()=>{ if(!deferred) return; deferred.prompt(); await deferred.userChoice; deferred=null; });

document.addEventListener('touchstart',()=>{}, {passive:true});
// default light theme
try{ document.body.classList.add('light'); }catch{}
document.addEventListener('touchmove',()=>{}, {passive:true});

// Tabs
document.querySelectorAll('#tabs .tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('#tabs .tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('main section').forEach(s=>s.classList.add('hide'));
  document.getElementById(btn.dataset.target).classList.remove('hide');
}));

// ======= Registros: turmas, alunos, arquivos =======
async function refreshClasses(sel){
  const classes = await listClasses();
  sel.innerHTML = classes.map(c=>`<option value="${c.id}">${c.nome} (${c.turno})</option>`).join('');
}
$('#c-add').addEventListener('click', async ()=>{
  const nome=$('#c-nome').value.trim(); const ano=$('#c-ano').value.trim(); const turno=$('#c-turno').value.trim();
  if(!nome) return showToast('Nome da turma obrigatório');
  await addClass({ nome, ano, turno }); $('#c-nome').value=''; await refreshClasses($('#c-sel')); await refreshClasses($('#att-class')); await refreshClasses($('#pl-class')); await refreshClasses($('#ex-class')); showToast('Turma criada');
});
$('#s-add').addEventListener('click', async ()=>{
  const classId = Number($('#c-sel').value||0); if(!classId) return showToast('Selecione a turma');
  const name = $('#s-nome').value.trim(); if(!name) return showToast('Informe o nome do aluno');
  await addStudent({ classId, name }); $('#s-nome').value=''; renderStudents();
});
async function renderStudents(){
  const classId = Number($('#c-sel').value||0); if(!classId){ $('#s-list').innerHTML=''; return; }
  const list = await listStudentsByClass(classId);
  $('#s-list').innerHTML = list.map(s=>`<div class="row" style="justify-content:space-between;border-bottom:1px dashed #273144;padding:4px 0"><div>${s.name}</div><div class="small">id:${s.id}</div></div>`).join('');
}
$('#c-sel').addEventListener('change', renderStudents);
refreshClasses($('#c-sel')).then(renderStudents);
refreshClasses($('#att-class')); refreshClasses($('#pl-class')); refreshClasses($('#ex-class'));

// Files
$('#f-save').addEventListener('click', async ()=>{
  const files = $('#f-in').files; if(!files?.length) return showToast('Selecione arquivos');
  const { addAttachment } = await import('./modules/files.js');
  for(const f of files){ await addAttachment(f); }
  showToast('Arquivos anexados');
});
$('#f-listar').addEventListener('click', async ()=>{
  const arr = await db.files.orderBy('createdAt').reverse().toArray();
  $('#f-list').innerHTML = arr.map(f=>`<div class="row" style="margin:4px 0"><span class="badge">${f.type.split('/')[0]}</span> ${f.name} <span class="small">(${Math.round((f.size||0)/1024)} KB)</span></div>`).join('');
});

// ======= Presença =======
let attCtrl = null;
$('#att-load').addEventListener('click', async ()=>{
  const classId = Number($('#att-class').value||0); const date = $('#att-date').value;
  if(!classId||!date) return showToast('Selecione turma e data');
  attCtrl = await loadAttendanceUI(classId, date, $('#att-mount')); showToast('Lista carregada');
});
$('#att-save').addEventListener('click', async ()=>{
  if(!attCtrl) return showToast('Carregue a lista primeiro');
  const id = await attCtrl.save(); showToast('Presença salva (#'+id+')');
});
$('#att-pdf').addEventListener('click', async ()=>{
  if(!attCtrl) return showToast('Carregue a lista primeiro');
  const turmaNome = $('#att-class').selectedOptions[0]?.textContent || 'Turma';
  const date = $('#att-date').value;
  const faltosos = attCtrl.getAbsences();
  const { pdfAbsenceNotice } = await import('./modules/attendance.js'); const blob = await pdfAbsenceNotice({ turmaNome, date, faltosos });
  const url = URL.createObjectURL(blob); Object.assign(document.createElement('a'),{href:url,download:'arquivo.pdf'}),{href:url,download:'arquivo.pdf'}).click(); URL.revokeObjectURL(url);
});

// ======= BNCC busca (explorar) =======
const runBNCC = debounce(async()=>{ const q=$('#bncc-q').value.trim(); if(!q) return; $('#bncc-res').innerHTML='<div class="skeleton" style="height:60px;border-radius:12px"></div>'; const res = await cacheGet('bncc:'+q, ()=>searchBNCC(q)); $('#bncc-res').innerHTML = (res||[]).map(r=>`<div class="card" style="padding:10px;margin:6px 0"><b>${r.codigo}</b> — <span class="badge">${r.componente}</span><div>${r.descricao}</div></div>`).join('') || '<small>Nada encontrado.</small>'; }, 300);
$('#bncc-buscar').addEventListener('click', runBNCC);
$('#bncc-q').addEventListener('input', runBNCC);

// ======= Agente: Plano =======
let pl_bncc = [];
async function addBnccTo(listEl, qEl){
  const q = qEl.value.trim(); if(!q) return;
  const res = await searchBNCC(q); if(!res.length) return showToast('Nada encontrado');
  pl_bncc.push(res[0].codigo); listEl.innerHTML = codesToChips(pl_bncc);
  qEl.value='';
}
$('#pl-bncc-add').addEventListener('click', ()=>addBnccTo($('#pl-bncc-list'), $('#pl-bncc-q')));
let lastLesson=null;
$('#pl-gerar').addEventListener('click', async ()=>{
  const classId = Number($('#pl-class').value||0); const date=$('#pl-date').value; if(!classId||!date) return showToast('Selecione turma e data');
  const { buildLesson, saveLessonToDB, pdfLesson } = await import('./agents/lesson.js');
  const l = buildLesson({
    classId: classId, date: date, duracao: $('#pl-dur').value||'50min',
    tema: $('#pl-tema').value.trim(),
    bncc: pl_bncc.slice(),
    conteudos: ($('#pl-cont').value||'').split('\n').filter(Boolean),
    metodos: ($('#pl-met').value||'').split('\n').filter(Boolean),
    materiais: ($('#pl-mat').value||'').split('\n').filter(Boolean),
    avaliacao: $('#pl-av').value, aee: $('#pl-aee').value, tarefas: $('#pl-tar').value
  });
  const id = await saveLessonToDB(l); lastLesson=l;
  $('#pl-prev').textContent = JSON.stringify(l, null, 2);
  showToast('Plano salvo (#'+id+')');
});
$('#pl-pdf').addEventListener('click', async ()=>{
  if(!lastLesson) return showToast('Gere/Salve o plano antes');
  const turmaNome = $('#pl-class').selectedOptions[0]?.textContent || 'Turma';
  const { pdfLesson } = await import('./agents/lesson.js');
  const blob = await pdfLesson(lastLesson, { turmaNome });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:'plano-aula.pdf'}).click(); URL.revokeObjectURL(url);
});


// ======= Agente: História =======
let lastStory = null;
$('#st-gerar').addEventListener('click', ()=>{
  const tema = ($('#st-tema').value||'amizade').trim();
  const personagens = ($('#st-pers').value||'Lia,Ravi').split(',').map(s=>s.trim()).filter(Boolean);
  const enredo = ($('#st-enr').value||'Na escola, surge um desafio que exige cooperação.').trim();
  const serie = $('#st-serie').value; const estilo = $('#st-estilo').value; const tamanho = $('#st-size').value;
  import('./agents/story.js').then(m=>{
    lastStory = m.buildStory({ tema, personagens, enredo, serie, estilo, tamanho });
    setTimeout(()=>{
      if(lastStory){
        $('#st-prev').textContent = lastStory.title + '\n\n' + lastStory.text + '\n\n' + 'BNCC: ' + lastStory.bncc.join(', ');
        showToast('História gerada');
      }
    }, 0);
  });
});
$('#st-salvar').addEventListener('click', async ()=>{
  if(!lastStory) return showToast('Gere uma história');
  const { saveStoryToDB } = await import('./agents/story.js');
  const id = await saveStoryToDB(lastStory); showToast('Salvo (#'+id+')');
});
$('#st-pdf').addEventListener('click', async ()=>{
  if(!lastStory) return showToast('Gere uma história');
  const { pdfStory } = await import('./agents/story.js');
  const blob = await pdfStory(lastStory);
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:'arquivo.pdf'}),{href:url,download:'arquivo.pdf'}).click(); URL.revokeObjectURL(url);
});
// ======= Exercícios =======
let ex_bncc = []; let items = [];
$('#ex-bncc-add').addEventListener('click', async ()=>{
  const q = $('#ex-bncc-q').value.trim(); if(!q) return;
  const res = await searchBNCC(q); if(!res.length) return showToast('Nada encontrado');
  ex_bncc.push(res[0].codigo); $('#ex-bncc-list').innerHTML = ex_bncc.map(c=>`<span class="badge">${c}</span>`).join(' ');
  $('#ex-bncc-q').value='';
});
function showTypePanels(){
  const t=$('#ex-tipo').value;
  $('#ex-alt').classList.add('hide'); $('#ex-vf').classList.add('hide'); $('#ex-lac').classList.add('hide');
  if(t==='multipla') $('#ex-alt').classList.remove('hide');
  if(t==='vf') $('#ex-vf').classList.remove('hide');
  if(t==='lacuna') $('#ex-lac').classList.remove('hide');
}

$('#ex-tipo').addEventListener('change', showTypePanels); showTypePanels();
let lastImgId=null;
$('#ex-img').addEventListener('change', async (e)=>{
  const f = e.target.files?.[0]; if(!f){ lastImgId=null; return; }
  const { addAttachment } = await import('./modules/files.js');
  lastImgId = await addAttachment(f);
  showToast(lastImgId?'Imagem anexada':'Sem imagem');
});
$('#ex-add').addEventListener('click', async ()=>{
  const tipo=$('#ex-tipo').value; const enunciado=($('#ex-enun').value||'').trim(); if(!enunciado) return showToast('Escreva um enunciado');
  let item=null; const { createItem } = await import('./modules/exercises.js');
  if(tipo==='multipla'){
    const alts=($('#ex-alts').value||'').split('\n').filter(Boolean);
    if(alts.length<4) return showToast('Forneça 4 alternativas');
    const correta=parseInt($('#ex-correta').value||'0',10);
    item=createItem({tipo, enunciado, alternativas: alts.slice(0,4), correta, imagemFileId:lastImgId});
  }
  if(tipo==='vf'){
    const correta=$('#ex-vf-val').value==='true';
    item=createItem({tipo,enunciado,correta,imagemFileId:lastImgId});
  }
  if(tipo==='lacuna'){
    const correta=$('#ex-lac-val').value||'';
    item=createItem({tipo,enunciado,correta,imagemFileId:lastImgId});
  }
  items.push(item); lastImgId=null; $('#ex-img').value=''; $('#ex-enun').value=''; $('#ex-alts').value=''; $('#ex-list').textContent = JSON.stringify(items, null, 2);
});
$('#ex-save').addEventListener('click', async ()=>{
  const classId=Number($('#ex-class').value||0); const tema=$('#ex-titulo').value||'Atividade'; const serie=$('#ex-serie').value||'';
  const { saveExercisesToDB } = await import('./modules/exercises.js');
  const id = await saveExercisesToDB({ classId, tema, serie, bncc: ex_bncc.slice(), itens: items.slice() });
  showToast('Atividade salva (#'+id+')');
});
$('#ex-pdf').addEventListener('click', async ()=>{
  if(!items.length) return showToast('Adicione itens');
  const { pdfExercises } = await import('./modules/exercises.js');
  const blob = await pdfExercises({ 
    titulo: $('#ex-titulo').value||'Exercícios', 
    turma: $('#ex-class').selectedOptions[0]?.textContent||'', 
    serie: $('#ex-serie').value||'', 
    bncc: ex_bncc, 
    itens: items 
  });
  const url = URL.createObjectURL(blob); 
  Object.assign(document.createElement('a'),{href:url,download:'arquivo.pdf'}),{href:url,download:'arquivo.pdf'}).click(); URL.revokeObjectURL(url);
});
  const url = URL.createObjectURL(blob); Object.assign(document.createElement('a'),{href:url,download:'arquivo.pdf'}),{href:url,download:'arquivo.pdf'}).click(); URL.revokeObjectURL(url);
});
$('#ex-gabarito').addEventListener('click', async ()=>{
  if(!items.length) return showToast('Adicione itens');
  const { pdfAnswerKey } = await import('./modules/exercises.js');
  const blob = await pdfAnswerKey({ titulo: 'Gabarito', itens: items });
  const url = URL.createObjectURL(blob); 
  Object.assign(document.createElement('a'),{href:url,download:'arquivo.pdf'}),{href:url,download:'arquivo.pdf'}).click(); URL.revokeObjectURL(url);
});
  const url = URL.createObjectURL(blob); Object.assign(document.createElement('a'),{href:url,download:'arquivo.pdf'}),{href:url,download:'arquivo.pdf'}).click(); URL.revokeObjectURL(url);
});