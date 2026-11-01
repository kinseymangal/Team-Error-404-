import React,{useState,useEffect} from 'react';
import {api} from './offline';
import {useT,useLanguage} from './i18n';
import {diseases} from '../shared/visualization.mjs';
export function DiseaseModules({selected,onSelect}){
 const t=useT(),lang=useLanguage(),[models,setModels]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{api('/api/disease-models').then(setModels).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 const chosen=diseases.find(d=>d.id===selected),configured=models.find(d=>d.id===selected)?.configured;
 return <section className="disease-modules"><div className="disease-grid">{diseases.map(d=>{const available=models.find(m=>m.id===d.id)?.configured;return <button type="button" key={d.id} className={'disease-card '+(selected===d.id?'selected':'')} onClick={()=>onSelect(d.id)} aria-pressed={selected===d.id}><strong>{lang==='hi'?d.hi:d.name}</strong><span className={available?'model-available':'model-unavailable'}>{loading?t('Checking model…','मॉडल जाँच रहे हैं…'):available?(d.id==='glaucoma'?t('Glaucoma screening','ग्लूकोमा स्क्रीनिंग'):t('Research model available','शोध मॉडल उपलब्ध')):t('Coming soon','जल्द आ रहा है')}</span></button>})}</div>{error&&<p role="alert">{error}</p>}{chosen&&<div className="disease-description"><strong>{lang==='hi'?chosen.hi:chosen.name}</strong><p>{t('Assessment targets','जाँच के विषय')}: {lang==='hi'?chosen.targetsHi:chosen.targets}</p><p>{lang==='hi'?chosen.noteHi:chosen.note}</p>{selected==='amd'&&<p>{t('No AI result, lesion count, confidence, heatmap or segmentation will be generated for this module until an appropriate trained model is installed.','उचित प्रशिक्षित मॉडल स्थापित होने तक इस मॉड्यूल का AI परिणाम, घाव संख्या, स्कोर, हीटमैप या विभाजन नहीं बनेगा।')}</p>}</div>}</section>;
}
