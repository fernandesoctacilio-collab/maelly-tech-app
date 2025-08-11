
import { addFile, getFile } from './db.js';
export async function addAttachment(file, { resizeMax=1600 } = {}){
  if(file && file.type.startsWith('image/')){
    const img = await createImageBitmap(file);
    const scale = Math.min(1, resizeMax / Math.max(img.width, img.height));
    const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
    const canvas = new OffscreenCanvas(w, h); const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    const id = await addFile({ name: file.name, type: 'image/jpeg', data: blob });
    return id;
  }else{
    const id = await addFile({ name: file.name, type: file.type, data: file });
    return id;
  }
}
export async function blobUrlOf(fileId){
  const f = await getFile(fileId); if(!f) return null;
  return URL.createObjectURL(f.data);
}
