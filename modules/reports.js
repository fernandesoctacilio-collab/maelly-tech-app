
import { db } from './db.js';
export async function pdfBnccMonthly({ classId, monthISO }){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt'}); const pad=36;
  const tur = await db.classes.get(classId); const alunos = await db.students.where('classId').equals(classId).toArray();
  const lessons = await db.lessons.where('classId').equals(classId).toArray();
  const mm = monthISO.slice(0,7);
  const L = lessons.filter(l=> (l.date||'').startsWith(mm) );
  const codes = new Set(); L.forEach(l=> (l.objetivosBNCC||[]).forEach(c=>codes.add(c)));
  // header
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(`Relatório BNCC — ${tur?.nome||''} (${mm})`, pad, pad);
  doc.setFont('helvetica','normal'); doc.setFontSize(12);
  let y=pad+24; doc.text(`Aulas no mês: ${L.length}`, pad, y); y+=18;
  doc.text(`Alunos: ${alunos.length}`, pad, y); y+=24;
  doc.setFont('helvetica','bold'); doc.text('Códigos trabalhados:', pad, y); y+=16; doc.setFont('helvetica','normal');
  const arr=[...codes]; if(!arr.length){ doc.text('— Nenhum código registrado.', pad, y); } else {
    arr.sort().forEach(c=>{ if(y>760){ doc.addPage(); y=pad; } doc.text('• '+c, pad, y); y+=16; });
  }
  return doc.output('blob');
}
