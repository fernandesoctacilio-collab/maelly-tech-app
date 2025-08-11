
import { db } from './db.js';
export async function listLessonsByDateRange(start,end){
  const all = await db.lessons.toArray();
  return all.filter(l=>l.date>=start && l.date<=end);
}
export async function duplicateLesson(lesson, dates){
  const copy = {...lesson}; delete copy.id;
  for(const dt of dates){ await db.lessons.add({ ...copy, date: dt }); }
}
