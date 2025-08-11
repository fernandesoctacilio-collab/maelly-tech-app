
import { listStudentsByClass, saveAttendance, getAttendance } from './db.js';
export async function loadAttendanceUI(classId, date, mount){
  const students = await listStudentsByClass(classId);
  const prev = await getAttendance(classId, date);
  const status = {}; (prev?.items||[]).forEach(it=>status[it.studentId]=it.status);
  mount.innerHTML = `<div class="row"><button id="att-all-p" class="secondary">Todos P</button><button id="att-clear" class="secondary">Limpar</button></div>
    <div style="margin-top:8px">
      ${students.map(s=>`<div class="row" style="justify-content:space-between;margin:4px 0">
        <div>${s.name}</div>
        <div class="row">
          <button class="ghost att-btn" data-id="${s.id}" data-v="P" ${status[s.id]==='P'?'style="border-color:#10b981;color:#10b981"':''}>P</button>
          <button class="ghost att-btn" data-id="${s.id}" data-v="A" ${status[s.id]==='A'?'style="border-color:#f59e0b;color:#f59e0b"':''}>A</button>
          <button class="ghost att-btn" data-id="${s.id}" data-v="F" ${status[s.id]==='F'?'style="border-color:#ef4444;color:#ef4444"':''}>F</button>
        </div></div>`).join('')}
    </div>`;
  mount.querySelectorAll('.att-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const id=Number(btn.dataset.id), v=btn.dataset.v;
    status[id]=v;
    mount.querySelectorAll(`.att-btn[data-id="${id}"]`).forEach(b=>b.style='');
    btn.style = v==='P'?'border-color:#10b981;color:#10b981':v==='A'?'border-color:#f59e0b;color:#f59e0b':'border-color:#ef4444;color:#ef4444';
  }));
  mount.querySelector('#att-all-p').addEventListener('click',()=>students.forEach(s=>{status[s.id]='P'; mount.querySelectorAll(`.att-btn[data-id="${s.id}"]`).forEach(b=>b.style=''); mount.querySelector(`.att-btn[data-id="${s.id}"][data-v="P"]`).style='border-color:#10b981;color:#10b981';}));
  mount.querySelector('#att-clear').addEventListener('click',()=>{ Object.keys(status).forEach(k=>delete status[k]); mount.querySelectorAll('.att-btn').forEach(b=>b.style=''); });
  return {
    async save(){ const items = students.map(s=>({ studentId:s.id, status: status[s.id]||'P' })); return saveAttendance(classId, date, items); },
    getAbsences(){ return students.filter(s=>status[s.id]==='F').map(s=>s.name); }
  };
}
export async function pdfAbsenceNotice({ turmaNome, date, faltosos }){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt'}); const pad=36;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('Notificação de Faltas', pad, pad);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(`${turmaNome} • ${date}`, pad, pad+14);
  let y=pad+34; doc.setFontSize(12);
  if(!faltosos.length){ doc.text('Sem faltas na data informada.', pad, y); } else {
    doc.text('Alunos com falta:', pad, y); y+=14;
    faltosos.forEach((n,i)=>{ if(y>760){ doc.addPage(); y=pad;} doc.text(`${i+1}. ${n}`, pad, y); y+=14; });
  }
  y+=24; doc.text('Responsável: ______________________________  Assinatura: ______________________', pad, y);
  return doc.output('blob');
}
