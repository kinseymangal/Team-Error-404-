// Confirm persistence immediately before inference, keeping the original case ID.
// A browser-saved registration is retried rather than blocked by a cached version.
export async function ensureRegisteredForAnalysis(active,{request,removeQueued}) {
  if(!active)throw new Error('Select or register a patient before analyzing images.');
  let doc;
  try {
    if(active.version>0){
      try {doc=await request(`/api/cases/${active._id}`);}
      catch(error){if(error.status!==404)throw error;}
    }
    if(!doc)doc=await request('/api/cases',{method:'POST',body:JSON.stringify({id:active._id,patient:active.patient})});
  } catch(error) {
    if(error.status)throw error;
    throw new Error('The local server is not reachable. Keep the नेत्रिव command window running with npm.cmd run dev (port 5173) or npm.cmd start (port 4000), and retry. Your selected images and saved registration are still available.',{cause:error});
  }
  if(doc?._id!==active._id||!Number.isInteger(doc.version)||doc.version<1)throw new Error('The server returned an invalid registration. Restart the नेत्रिव server and retry.');
  await removeQueued(active._id);
  return doc;
}
