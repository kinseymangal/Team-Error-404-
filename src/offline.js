let dbPromise;
function db(){return dbPromise||=new Promise((resolve,reject)=>{const req=indexedDB.open('nayansetu-v1',1);req.onupgradeneeded=()=>{req.result.createObjectStore('cache');req.result.createObjectStore('outbox',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function store(name,mode,action){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(name,mode),req=action(tx.objectStore(name));tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);});}
export const cachedCases=()=>store('cache','readonly',s=>s.get('cases'));
export const saveCases=rows=>store('cache','readwrite',s=>s.put(rows,'cases'));
export const queued=()=>store('outbox','readonly',s=>s.getAll());
export const enqueue=row=>store('outbox','readwrite',s=>s.put(row));
export const dequeue=id=>store('outbox','readwrite',s=>s.delete(id));
export async function api(path,options={}){
  const key=localStorage.getItem('nayansetu-key')||'';
  const response=await fetch(path,{...options,headers:{...(options.body instanceof FormData?{}:{'content-type':'application/json'}),'x-api-key':key,...options.headers}});
  const raw=await response.text();let body;
  try{body=JSON.parse(raw);}catch{throw Object.assign(new Error('The local API returned a page instead of JSON. Run npm.cmd run dev and open http://127.0.0.1:5173, or npm.cmd start on port 4000.'),{status:response.status||502});}
  if(!response.ok)throw Object.assign(new Error(body.error||'Request failed'),{status:response.status});return body;
}
export async function flushQueue(){let sent=0;for(const row of await queued()){await api('/api/cases',{method:'POST',body:JSON.stringify(row.payload)});await dequeue(row.id);sent++;}return sent;}
