
import { saveStory } from '../modules/db.js';

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export function buildStory({ tema='amizade', personagens=['Lia','Ravi'], enredo='Na escola, surge um desafio que exige cooperação.', serie='5º ano', estilo='fabula', tamanho='curta' }){
  const estilos = {
    fabula: { ini:['Era uma vez', 'Certa vez', 'Numa tarde'], moral:'Moral: juntos somos mais fortes.' },
    aventura: { ini:['Num fim de tarde chuvoso', 'Quando o dia caiu'], moral:'Lição: coragem com cuidado.' },
    misterio: { ini:['Tudo começou com um barulho estranho', 'Uma pista apareceu'], moral:'Lição: observar traz respostas.' },
    conto: { ini:['Era início de primavera', 'Numa manhã de sol'], moral:'Moral: empatia muda histórias.' }
  };
  const i = pick(estilos[estilo].ini);
  const nomes = Array.isArray(personagens)? personagens : String(personagens).split(',').map(s=>s.trim()).filter(Boolean);
  const corpoBase = `${i}, ${nomes.join(' e ')} decidiram agir. ${enredo} Entre tentativas e risadas, descobriram que cada ideia contava. No fim, celebraram o aprendizado.`;
  const extra = tamanho==='longa' ? ' Ao longo do caminho, combinaram regras, pediram ajuda e registraram as etapas para não esquecer.' : '';
  const texto = `${corpoBase}${extra} ${estilos[estilo].moral}`.trim();
  const titulo = `${tema[0].toUpperCase()+tema.slice(1)} — ${estilo}`;
  const bncc = serie.startsWith('2') ? ['EF02LP01','EF02LP02'] : ['EF05LP02','EF15LP16'];
  return { title: titulo, text: texto, bncc, meta:{ tema, personagens:nomes, enredo, serie, estilo, tamanho } };
}

export async function saveStoryToDB(story){ return saveStory(story); }

export async function pdfStory(story){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt' });
  const pad=36;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(story.title, pad, pad);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`BNCC: ${story.bncc.join(', ')}`, pad, pad+14);
  let y=pad+30; doc.setFontSize(12);
  const lines = doc.splitTextToSize(story.text, 540);
  lines.forEach(line=>{ if(y>760){ doc.addPage(); y=pad; } doc.text(line, pad, y); y+=14; });
  return doc.output('blob');
}
