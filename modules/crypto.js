
const enc = new TextEncoder(), dec = new TextDecoder();
async function derive(password, salt){
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'}, base, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}
export async function encryptJSON(obj, password){
  if(!password || password.length < 6) throw new Error('Senha muito curta');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt);
  const data = enc.encode(JSON.stringify(obj));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, data));
  const magic = enc.encode('MAELLY1:');
  return new Blob([magic, salt, iv, ct], {type:'application/octet-stream'});
}
export async function decryptToJSON(file, password){
  const buf = new Uint8Array(await file.arrayBuffer());
  const magic = enc.encode('MAELLY1:');
  for(let i=0;i<magic.length;i++) if(buf[i]!==magic[i]) throw new Error('Formato inválido');
  const salt = buf.slice(magic.length, magic.length+16);
  const iv = buf.slice(magic.length+16, magic.length+28);
  const ct = buf.slice(magic.length+28);
  const key = await derive(password, salt);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, ct);
  return JSON.parse(dec.decode(plain));
}
