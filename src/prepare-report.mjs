// Fetch the current saved record and complete missing experimental glaucoma outputs.
export async function prepareReport(doc,{disease,request}){
 let latest=await request(`/api/cases/${doc._id}`);
 if(!latest?._id)throw new Error('The saved report could not be loaded. Refresh and try again.');
 if(!['glaucoma','combined'].includes(disease))return latest;
 const model=await request('/api/glaucoma/status');
 for(const side of ['left','right']){
  const eye=latest.eyes?.[side];if(!eye?.imagePath)continue;
  const result=eye.glaucoma;
  const complete=result?.status==='research_prediction'&&result.scores?.length===2&&result.heatmap&&(!model.segmentation||result.opticSegmentation?.status);
  if(complete||result?.status==='recapture')continue;
  if(!model.configured)throw new Error('Glaucoma model is unavailable. Restart the updated server before exporting.');
  if(!model.researchTestMode)throw new Error('Complete this eye’s glaucoma screening before exporting.');
  latest=await request(`/api/cases/${latest._id}/eyes/${side}/glaucoma`,{method:'POST',body:JSON.stringify({version:latest.version,operatorConfirmed:false})});
  const updated=latest.eyes?.[side]?.glaucoma;
  if(updated?.status!=='research_prediction'&&updated?.status!=='recapture')throw new Error(updated?.message||'Glaucoma analysis did not complete. No incomplete PDF was printed.');
 }
 return latest;
}
