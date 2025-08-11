
import { saveLesson } from '../modules/db.js';
export function buildLesson(form){
  const lesson = { classId: form.classId, date: form.date, duracao: form.duracao || '50min', tema: form.tema,
    objetivosBNCC: form.bncc || [], conteudos: form.conteudos || [], metodologias: form.metodos || [], materiais: form.materiais || [],
    avaliacao: form.avaliacao || '', diferencasAEE: form.aee || '', tarefas: form.tarefas || '', anexos: form.anexos || [] };
  return lesson;
}
export async function saveLessonToDB(l){ return saveLesson(l); }
export async function pdfLesson(lesson, { turmaNome='Turma', professor='Professor(a)' } = {}){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt'}); const pad=36;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('Plano de Aula', pad, pad);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(`${turmaNome} • ${lesson.date} • Duração ${lesson.duracao}`, pad, pad+14);
  let y=pad+34; const line = (label, text)=>{ doc.setFont('helvetica','bold'); doc.text(label, pad, y); y+=14; doc.setFont('helvetica','normal'); doc.splitTextToSize(text||'-', 540).forEach(t=>{ if(y>760){ doc.addPage(); y=pad;} doc.text(t, pad, y); y+=14; }); y+=8; };
  line('Tema', lesson.tema);
  line('BNCC', (lesson.objetivosBNCC||[]).join(', '));
  line('Conteúdos/Habilidades', (lesson.conteudos||[]).join('; '));
  line('Metodologias/Atividades', (lesson.metodologias||[]).join('; '));
  line('Recursos/Materiais', (lesson.materiais||[]).join('; '));
  line('Avaliação', lesson.avaliacao);
  line('Diferenciação/AEE', lesson.diferencasAEE);
  line('Tarefa de casa', lesson.tarefas);
  return doc.output('blob');
}
