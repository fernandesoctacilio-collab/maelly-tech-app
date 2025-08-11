
export const db = new Dexie('maelly_front_v1');
db.version(1).stores({
  classes: '++id, nome, ano, turno',
  students: '++id, classId, name',
  stories: '++id, tema, createdAt',
  lessons: '++id, classId, date',
  attendance: '++id, classId, date',
  exercises: '++id, classId, tema, createdAt',
  files: '++id, name, type, size, createdAt'
});
export const nowIso = ()=> new Date().toISOString();
export async function addClass(obj){ return db.classes.add({ ...obj }); }
export async function listClasses(){ return db.classes.toArray(); }
export async function addStudent(obj){ return db.students.add({ ...obj }); }
export async function listStudentsByClass(classId){ return db.students.where('classId').equals(classId).toArray(); }
export async function listStudentsByClassPaginated(classId, offset=0, limit=50){ return db.students.where('classId').equals(classId).offset(offset).limit(limit).toArray(); }
export async function saveStory(s){ return db.stories.add({ ...s, createdAt: nowIso() }); }
export async function saveLesson(l){ return db.lessons.add({ ...l, createdAt: nowIso() }); }
export async function saveExercises(e){ return db.exercises.add({ ...e, createdAt: nowIso() }); }
export async function saveAttendance(classId, date, items){
  const existing = await db.attendance.where({classId, date}).first();
  if(existing){ await db.attendance.update(existing.id, { items }); return existing.id; }
  return db.attendance.add({ classId, date, items });
}
export async function getAttendance(classId, date){ return db.attendance.where({classId, date}).first(); }
export async function addFile({ name, type, data }){ const size = data.size || data.byteLength || 0; return db.files.add({ name, type, size, createdAt: nowIso(), data }); }
export async function getFile(id){ return db.files.get(id); }
export async function dumpAll(){
  const [classes, students, stories, lessons, attendance, exercises, files] = await Promise.all([
    db.classes.toArray(), db.students.toArray(), db.stories.toArray(), db.lessons.toArray(),
    db.attendance.toArray(), db.exercises.toArray(), db.files.toArray()
  ]);
  return { schema:'v1', ts: Date.now(), classes, students, stories, lessons, attendance, exercises, files };
}
export async function restoreDump(obj){
  if(!obj || !obj.schema) throw new Error('Dump inválido');
  await db.transaction('rw', db.classes, db.students, db.stories, db.lessons, db.attendance, db.exercises, db.files, async () => {
    await db.classes.clear(); await db.students.clear(); await db.stories.clear();
    await db.lessons.clear(); await db.attendance.clear(); await db.exercises.clear(); await db.files.clear();
    await db.classes.bulkAdd(obj.classes || []); await db.students.bulkAdd(obj.students || []);
    await db.stories.bulkAdd(obj.stories || []); await db.lessons.bulkAdd(obj.lessons || []);
    await db.attendance.bulkAdd(obj.attendance || []); await db.exercises.bulkAdd(obj.exercises || []);
    await db.files.bulkAdd(obj.files || []);
  });
}

export async function seedDefaults(){
  const count = await db.classes.count();
  if(count>0) return;
  const id2 = await db.classes.add({ nome:'2º Ano A', ano:'2025', turno:'Manhã' });
  const id5 = await db.classes.add({ nome:'5º Ano A', ano:'2025', turno:'Tarde' });
  // Optional: add a few sample students for demo
  const s2 = ['Ana','Bruno','Clara','Diego','Eva'];
  const s5 = ['Fábio','Gabi','Heitor','Íris','João'];
  await db.students.bulkAdd(s2.map(name=>({ classId:id2, name })));
  await db.students.bulkAdd(s5.map(name=>({ classId:id5, name })));
}

// Upgrade: add question_bank and packs
db.version(2).stores({
  question_bank: '++id, code, subject, year, createdAt',
  packs: '++id, name, createdAt'
});
export async function bankAdd(items){
  // items: array of {subject, year, code, item, tags?}
  const shaped = items.map(x=>({ subject:x.subject, year:x.year, code:x.code, item:x.item, tags:x.tags||[], createdAt: nowIso() }));
  return db.question_bank.bulkAdd(shaped);
}
export async function bankList({subject,year,code}={}){
  let q = db.question_bank; if(subject) q = q.where('subject').equals(subject);
  const arr = await q.toArray();
  return arr.filter(x=>(!year or x.year===year) && (!code or x.code===code));
}
export async function bankExportAll(){
  const items = await db.question_bank.toArray(); return { schema:'qbank-v1', items };
}
export async function bankImportAll(obj){
  if(!obj || !obj.items) throw new Error('Pacote inválido');
  await db.question_bank.bulkAdd(obj.items);
}

export async function bankToggleFav(id){
  const it = await db.question_bank.get(id); if(!it) return;
  await db.question_bank.update(id, { fav: !it.fav });
}
export async function bankListAll(){ return db.question_bank.orderBy('createdAt').reverse().toArray(); }
export async function bankUpdateTags(id, tags){ await db.question_bank.update(id, { tags }); }
