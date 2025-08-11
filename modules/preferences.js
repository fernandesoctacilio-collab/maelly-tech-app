
const KEY='maelly:prefs';
const DEF={ defaultClassId:null, lessonDuration:'50', teacherName:'', signature:'', filePrefix:'', theme:'#60a5fa' };
export function loadPrefs(){ try{ return {...DEF, ...(JSON.parse(localStorage.getItem(KEY)||'{}'))}; }catch{ return {...DEF}; } }
export function savePrefs(p){ localStorage.setItem(KEY, JSON.stringify(p)); applyTheme(p); }
export function applyTheme(p){ if(!p) p=loadPrefs(); document.documentElement.style.setProperty('--accent', p.theme||'#60a5fa'); }
export function setDefaultClass(id){ const p=loadPrefs(); p.defaultClassId=id; savePrefs(p); }
export function prefs(){ return loadPrefs(); }
applyTheme();
