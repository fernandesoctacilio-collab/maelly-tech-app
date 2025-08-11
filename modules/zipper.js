
export async function makeZip(files){
  // files: [{name, blob}]
  if(!window.JSZip){ throw new Error('JSZip não carregado'); }
  const zip = new JSZip();
  files.forEach(f=>zip.file(f.name, f.blob));
  const blob = await zip.generateAsync({type:'blob'});
  return blob;
}
