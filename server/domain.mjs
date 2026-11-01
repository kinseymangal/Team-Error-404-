export const gradeNames=['No apparent DR','Mild NPDR','Moderate NPDR','Severe NPDR','Proliferative DR'];
export const todayIndia=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export {facilities,villages} from './directory.mjs';
import {facilities} from './directory.mjs';
export function distanceKm(a,b){const rad=x=>x*Math.PI/180;const dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng);const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function planReferral(patient, urgencyDays, start=todayIndia(), reviewedDate=start,listing=facilities) {
  const end=new Date(`${reviewedDate}T00:00:00Z`);end.setUTCDate(end.getUTCDate()+urgencyDays);
  const deadline=end.toISOString().slice(0,10);
  const options=listing.map(f=>{
    const dates=[];
    for(let offset=0;offset<=90;offset++){
      const day=new Date(`${start}T00:00:00Z`);day.setUTCDate(day.getUTCDate()+offset);
      const date=day.toISOString().slice(0,10);if(date>deadline)break;
      if((!f.days?.length||f.days.includes(day.getUTCDay()))&&patient.availableDays.includes(day.getUTCDay()))dates.push(date);
    }
    return {...f,dates,date:dates[0]||null,escortOutstanding:patient.escortNeeded&&!patient.escortConfirmed,transportOutstanding:patient.transportNeeded};
  }).filter(f=>f.date);
  return {options,deadline,escalate:!options.length||options.every(f=>f.escortOutstanding),note:'Dates match published opening days and patient availability. Contact the hospital to confirm retina-clinic availability. Transport must be arranged separately.'};
}
export function softmax(logits){const max=Math.max(...logits),v=logits.map(x=>Math.exp(x-max)),sum=v.reduce((a,b)=>a+b,0);return v.map(x=>x/sum);}
export function gradCam(features,weights,channels,spatial,grade){
  const result=new Float32Array(spatial);
  for(let c=0;c<channels;c++)for(let s=0;s<spatial;s++)result[s]+=weights[grade*channels+c]*features[c*spatial+s];
  let max=0;for(let s=0;s<spatial;s++){result[s]=Math.max(0,result[s]);max=Math.max(max,result[s]);}
  if(max>0)for(let s=0;s<spatial;s++)result[s]/=max;
  return result;
}
