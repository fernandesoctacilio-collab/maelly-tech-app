
import { db } from './db.js';
import { searchBNCC } from './bncc.js';
import { prefs } from './preferences.js';
import { generateByBNCC } from './genbank.js';
import { pdfExercises, pdfAnswerKey } from './exercises.js';
import { buildLesson, saveLessonToDB, pdfLesson } from '../agents/lesson.js';
import { pdfAbsenceNotice } from './attendance.js';
import { addAttachment } from './files.js';
import { makeZip } from './zipper.js';

function todayISO(){ return new Date().toISOString().slice(0,10); }

// Fast attendance
export async function mountFastAttendance(mount, {classId, date=todayISO()}){
  const students = await db.students.where('classId').equals(classId).toArray();
  let status = Object.fromEntries(students.map(s=>[s.id,'P']));
  mount.innerHTML = `<div class="row" style="gap:8px;margin-bottom:8px">
    <button id="fa-mode-p" class="secondary">Marcar P</button>
    <button id="fa-mode-a" class="ghost">Marcar A</button>
    <button id="fa-mode-f" class="ghost">Marcar F</button>
    <span class="small" id="fa-tip">Clique e arraste pelos nomes</span>
  </div>
  <div id="fa-list" class="grid grid-3"></div>`;
  const list = mount.querySelector('#fa-list');
  let current='P', dragging=false;
  function render(){
    list.innerHTML = students.map(s=>`<div class="card fa-stu" data-id="${s.id}" style="padding:12px;cursor:pointer">
      <div style="font-weight:600">${s.name}</div>
      <div class="small">Status: <span class="fa-st">${status[s.id]}</span></div>
    </div>`).join('');
  }
  render();
  mount.querySelector('#fa-mode-p').onclick=()=>{current='P'};
  mount.querySelector('#fa-mode-a').onclick=()=>{current='A'};
  mount.querySelector('#fa-mode-f').onclick=()=>{current='F'};
  list.addEventListener('pointerdown',e=>{ const el=e.target.closest('.fa-stu'); if(!el) return; dragging=true; status[Number(el.dataset.id)]=current; el.querySelector('.fa-st').textContent=current; });
  list.addEventListener('pointerover',e=>{ if(!dragging) return; const el=e.target.closest('.fa-stu'); if(!el) return; status[Number(el.dataset.id)]=current; el.querySelector('.fa-st').textContent=current; });
  window.addEventListener('pointerup',()=>dragging=false);
  return {
    async save(){
      // persist attendance record
      const items = Object.entries(status).map(([studentId,st])=>({studentId:Number(studentId),status:st}));
      const id = await db.attendance.add({ classId, date, items, createdAt:new Date().toISOString() });
      return id;
    },
    getAbsences(){ return Object.entries(status).filter(([,st])=>st!=='P').map(([id,st])=>({ studentId:Number(id), status:st })); }
  };
}

// Content quick
export async function quickContentToPlan({classId, date, tema, bncc=[]}){
  const l = buildLesson({
    classId, date, duracao: prefs().lessonDuration+'min',
    tema: tema||'Aula',
    bncc: bncc,
    conteudos: [tema],
    metodos: ['Exposição dialogada','Atividade prática'],
    materiais: ['Quadro','Caderno'],
    avaliacao: 'Observação e atividade da aula.',
    aee: '', tarefas: ''
  });
  const id = await saveLessonToDB(l); return { id, lesson:l };
}

// Activities
export async function generateActivity({ subject, year, code, difficulty='medio', quantity=6, tema='Atividade' }){
  const items = await generateByBNCC({ subject, year, code, difficulty, quantity, theme: tema });
  return items;
}

export async function exportZipDaAula({ exercisesBlob, answerBlob, lessonBlob, prefix='Aula' }){
  const files = [];
  if(exercisesBlob) files.push({ name:`${prefix}-exercicios.pdf`, blob:exercisesBlob });
  if(answerBlob) files.push({ name:`${prefix}-gabarito.pdf`, blob:answerBlob });
  if(lessonBlob) files.push({ name:`${prefix}-plano.pdf`, blob:lessonBlob });
  const zipBlob = await makeZip(files);
  return zipBlob;
}
