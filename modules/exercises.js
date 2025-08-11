
import { saveExercises } from './db.js';
import { addAttachment, blobUrlOf } from './files.js';
export function createItem({tipo, enunciado, alternativas, correta, imagemFileId}){
  return { tipo, enunciado, alternativas: alternativas||[], correta: correta??null, imagemFileId: imagemFileId||null };
}
export async function handleImageInput(fileInput){
  const f = fileInput.files?.[0]; if(!f) return null;
  const id = await addAttachment(f);
  return id;
}
export async function pdfExercises({ titulo, turma, serie, bncc, itens }){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt'}); const pad=36;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(titulo || 'Caderno de Exercícios', pad, pad);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(`${turma||'-'} • Série: ${serie||'-'} • BNCC: ${(bncc||[]).join(', ')}`, pad, pad+14);
  let y=pad+34; doc.setFontSize(12); let num=1;
  for(const it of itens){
    const block = [`${num}. ${it.enunciado}`];
    if(it.tipo==='multipla' && it.alternativas?.length){
      it.alternativas.forEach((a,i)=>block.push(`   ${String.fromCharCode(65+i)}) ${a}`));
    }
    for(const line of doc.splitTextToSize(block.join('\n'), 540)){
      if(y>760){ doc.addPage(); y=pad; } doc.text(line, pad, y); y+=14;
    }
    const dataUrlInline = it.imagemDataUrl || null;
    if(it.imagemFileId || dataUrlInline){
      let dataUrl = dataUrlInline;
      if(!dataUrl && it.imagemFileId){ const url = await blobUrlOf(it.imagemFileId); if(url){ const img = await (await fetch(url)).blob(); dataUrl = await blobToDataURL(img); } }
      if(dataUrl){ const w=360, h=240; if(y+h>780){ doc.addPage(); y=pad; } doc.addImage(dataUrl, 'JPEG', pad, y, w, h); y+=h+10; }
    }
    y+=8; num++;
  }
  return doc.output('blob');
}
export async function pdfAnswerKey({ titulo, itens }){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt'}); const pad=36;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text((titulo||'Gabarito'), pad, pad);
  let y=pad+30; doc.setFont('helvetica','normal'); doc.setFontSize(12);
  itens.forEach((it,i)=>{
    const ans = it.tipo==='multipla' ? String.fromCharCode(65 + (it.correta ?? -1)) :
               it.tipo==='vf' ? (it.correta===true?'V':'F') :
               it.tipo==='lacuna' ? (it.correta||'—') : '—';
    if(y>760){ doc.addPage(); y=pad; } doc.text(`${i+1}. ${ans}`, pad, y); y+=16;
  });
  return doc.output('blob');
}
async function blobToDataURL(blob){ return await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(blob); }); }
export async function saveExercisesToDB(obj){ return saveExercises(obj); }
