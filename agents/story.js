
import { saveStory } from '../modules/db.js';
const rand = a=>a[Math.floor(Math.random()*a.length)];
const cap = s=>s.charAt(0).toUpperCase()+s.slice(1);
const sentences = t=>t.split(/(?<=[\.\!\?])\s+/).filter(Boolean);
const words = t=>t.toLowerCase().replace(/[^a-zà-ú0-9\s-]/gi,'').split(/\s+/).filter(Boolean);
const syl = w => ((w.toLowerCase().normalize('NFD').replace(/[^a-z0-9\s]/g,'').match(/[aeiou]+/g))||[]).length || 1;
function fsScore(text){ const s=Math.max(1, sentences(text).length), w=Math.max(1, words(text).length), sy=words(text).reduce((a,v)=>a+syl(v),0); return Math.round((206.835-62.3*(sy/w)-(w/s))*10)/10; }
function band(score){ if(score>=80)return"Muito fácil (2º ano)"; if(score>=60)return"Fácil (3º-4º ano)"; if(score>=40)return"Médio (5º ano)"; return"Desafiante (acima do 5º)"; }
const styles={ fabula:{ opener:["Era uma vez","Certa vez","Numa vila distante"], moral:["Moral: amizade ilumina o caminho.","Moral: coragem nasce da cooperação."]},
  aventura:{ opener:["Num fim de tarde chuvoso","Quando o dia comum virou aventura"], moral:["Lição: curiosidade com cuidado.","Lição: equipe é bússola."]},
  misterio:{ opener:["Tudo começou com um barulho estranho","Uma pista surgiu na escola"], moral:["Lição: observar bem traz respostas."]},
  conto:{ opener:["Era início de primavera","Numa manhã de sol macio"], moral:["Moral: empatia muda histórias."]}
};
function craft(beat, ctx){
  const { tema, personagens, enredo, estilo, per } = ctx;
  const kit = styles[estilo]||styles.conto;
  const who = personagens.length?personagens.join(", "):"um grupo de amigos";
  const opener = beat==='gancho' ? rand(kit.opener)+", " : "";
  const seeds={ gancho:`${opener}${enredo?enredo.trim()+". ":""}Falava-se sobre ${tema}. ${who} estavam curiosos.`,
    problema:`Mas algo aconteceu: ${cap(tema)} trouxe um desafio inesperado.`, busca:`${cap(who.split(",")[0])} teve uma ideia e os outros ajudaram.`,
    virada:`Uma pista apareceu e todos passaram a cooperar.`, climax:`No momento decisivo, lembraram do que aprenderam e aplicaram juntos.`,
    fecho:`Com tudo resolvido, ${who} perceberam que cresceram com a experiência.` };
  let text = seeds[beat]; while(words(text).length < per){ text += " " + rand(["Eles respiraram fundo e observaram.","Falas curtas mostraram respeito.","O coração ficou tranquilo.","As mãos trabalharam juntas."]); }
  return text.trim();
}
export function buildStory({tema, personagens, enredo, serie, estilo, tamanho}){
  const beats = ["gancho","problema","busca","virada","climax","fecho"];
  const target = tamanho==='curta'?300:tamanho==='media'?500:700; const per = Math.floor(target/beats.length);
  const paragraphs = beats.map(b=>craft(b,{tema,personagens,enredo,estilo,per}));
  const kit = styles[estilo]||styles.conto; const moral = rand(kit.moral);
  const title = cap(tema) + " em " + (estilo==='fabula'?"Fábula":cap(estilo));
  const text = (paragraphs.join(" ")+" "+moral).trim();
  const score = fsScore(text), lvl = band(score);
  const qs = { literal:["Onde a história acontece?","Qual foi o desafio?"], inferencial:["Por que a cooperação ajudou na solução?","O que mudaria sem escuta e respeito?"], vocab:["Ache uma palavra que represente amizade.","Qual palavra indica coragem?"] };
  let simple = paragraphs.map(p=>sentences(p).slice(0,2).join(" ")).join(" ");
  const bncc = ["EF15LP16","EF12LP18"];
  return { title, text, paragraphs, moral, score, band:lvl, serie, estilo, bncc, questions: qs, simple };
}
export async function saveStoryToDB(a){ return saveStory({ tema:a.title, ...a }); }
export async function pdfStory(a){
  const { jsPDF } = window.jspdf; const doc = new jsPDF({unit:'pt'}); const pad=36;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(a.title, pad, pad);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(`BNCC: ${a.bncc.join(', ')} • Nível: ${a.band} (FS ${a.score})`, pad, pad+14);
  let y=pad+30; doc.setFontSize(12);
  doc.splitTextToSize(a.text, 540).forEach(line => { if(y>760){ doc.addPage(); y=pad; } doc.text(line, pad, y); y+=14; });
  doc.addPage(); y=pad; doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text('Perguntas de compreensão', pad, y); y+=18;
  doc.setFont('helvetica','normal'); doc.setFontSize(12);
  ['literal','inferencial','vocab'].forEach(k=>{ doc.setFont('helvetica','bold'); doc.text(k.toUpperCase(), pad, y); y+=14; doc.setFont('helvetica','normal'); a.questions[k].forEach(q=>{ if(y>760){ doc.addPage(); y=pad;} doc.text('- '+q, pad, y); y+=14;}); y+=6; });
  doc.addPage(); y=pad; doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text('Versão simplificada (AEE/TEA)', pad, y); y+=18;
  doc.setFont('helvetica','normal'); doc.setFontSize(12);
  doc.splitTextToSize(a.simple, 540).forEach(line => { if(y>760){ doc.addPage(); y=pad;} doc.text(line, pad, y); y+=14; });
  return doc.output('blob');
}
