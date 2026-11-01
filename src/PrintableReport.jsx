import {PrintableGlaucoma} from './PrintableGlaucoma';
import React from 'react';
import {BrandLogo} from './BrandLogo';
import {useT,useLanguage,statusName} from './i18n';
import {gradeLabels,maskSummary,patientGuidance} from '../shared/report.mjs';
import {visibleFindings,lesionCategories,boxFor} from '../shared/visualization.mjs';
import './print-report.css';

const imageUrl=path=>path?(path+(localStorage.getItem('nayansetu-key')?'?key='+encodeURIComponent(localStorage.getItem('nayansetu-key')):'')):null;
const date=(value,lang)=>value?new Date(value).toLocaleString(lang==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata'}):'—';
function PrintImage({eye,mode,title}){
 const t=useT(),r=eye.result||{},summary=maskSummary(r.masks),findings=visibleFindings(eye);
 return <figure className="pdf-image"><figcaption>{title}</figcaption>{eye.imagePath?<div className="pdf-image-stack" style={{aspectRatio:r.imageSize?`${r.imageSize.width}/${r.imageSize.height}`:'1'}}>
 <img src={imageUrl(eye.imagePath)} alt={title}/>
 {mode==='heatmap'&&r.heatmap&&<img className="pdf-overlay" src={r.heatmap} alt={t('Grad-CAM overlay','ग्रैड-कैम परत')}/>}
 {mode==='segmentation'&&eye.findingsDecision!=='rejected'&&!summary.rejected&&Object.entries(r.masks||{}).filter(([code,m])=>!summary.suppressedCodes.includes(code)&&m.overlay).map(([code,m])=><img key={code} className="pdf-overlay" src={m.overlay} alt={code+' mask'}/>)}
 {mode==='segmentation'&&<svg className="pdf-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none">{findings.map((f,index)=>{const b=boxFor(f);return <g key={f.key}><rect x={b.x*1000} y={b.y*1000} width={b.width*1000} height={b.height*1000} fill="none" stroke={lesionCategories[f.category]?.color||'#00ffff'} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeDasharray={f.source==='model'?'5 3':undefined}/>{(f.source!=='model'||index<6)&&<text x={Math.min(900,b.x*1000+4)} y={Math.max(28,b.y*1000-5)} fill="white" stroke="black" paintOrder="stroke" strokeWidth="4" fontSize="38">{f.key}</text>}</g>})}</svg>}
 </div>:<p>{t('Original image unavailable','मूल तस्वीर उपलब्ध नहीं है')}</p>}
 {mode==='heatmap'&&!r.heatmap&&<p>{t('Heatmap unavailable for this screening.','इस स्क्रीनिंग का हीटमैप उपलब्ध नहीं है।')}</p>}
 {mode==='segmentation'&&<p>{t('Segmentation status','विभाजन स्थिति')}: {summary.status}{!findings.length?' · '+t('No supported regions; this does not exclude disease.','समर्थित क्षेत्र नहीं; इससे रोग खारिज नहीं होता।'):''}</p>}
 </figure>;
}
export function PrintableReport({doc,directory,disease='dr'}){
 const t=useT(),lang=useLanguage(),labels=gradeLabels[lang]||gradeLabels.en;
 if(!doc)return null;
 if(disease==='combined')return <><PrintableReport doc={doc} directory={directory} disease="dr"/><PrintableGlaucoma doc={doc}/></>;
 if(disease==='glaucoma')return <PrintableGlaucoma doc={doc}/>;
 const hospital=directory?.facilities?.find(f=>f.id===doc.referral?.facilityId),eyes=['left','right'];
 return <article className="print-report complete-screening-report">
 <header className="pdf-header"><BrandLogo/><div><h1>{t('Retinal screening report','रेटिना स्क्रीनिंग रिपोर्ट')}</h1><p>{t('AI-assisted research screening · Not a final diagnosis','AI-सहायता शोध स्क्रीनिंग · अंतिम निदान नहीं')}</p></div></header>
 <dl className="pdf-patient"><div><dt>{t('Patient','मरीज')}</dt><dd>{doc.patient?.name||'—'}</dd></div><div><dt>{t('Age','आयु')}</dt><dd>{doc.patient?.age??'—'}</dd></div><div><dt>{t('Report ID','रिपोर्ट आईडी')}</dt><dd>{doc._id}</dd></div><div><dt>{t('Screening date','स्क्रीनिंग तिथि')}</dt><dd>{date(doc.createdAt,lang)}</dd></div></dl>
 {doc.patient?.isDemo&&<p className="pdf-note">{t('DEMO PATIENT REPORT — not for real clinical care. Any demo-doctor review is simulated.','डेमो मरीज रिपोर्ट — वास्तविक चिकित्सकीय देखभाल के लिए नहीं। डेमो डॉक्टर की समीक्षा अनुकरण है।')}</p>} <h2>{t('Both-eye screening summary','दोनों आँखों की स्क्रीनिंग का सारांश')}</h2><table className="pdf-bilateral-summary"><thead><tr><th>{t('Eye','आँख')}</th><th>{t('Screening status','स्क्रीनिंग स्थिति')}</th><th>{t('AI-predicted grade','AI अनुमानित ग्रेड')}</th><th>{t('Highest model score','सबसे अधिक मॉडल स्कोर')}</th></tr></thead><tbody>{eyes.map(side=>{const r=doc.eyes?.[side]?.result,valid=r?.status==='analyzed'&&Number.isInteger(r.grade);return <tr key={side}><td>{side==='left'?t('Left eye','बाईं आँख'):t('Right eye','दाईं आँख')}</td><td>{r?statusName(r.status,lang):t('Image not uploaded','तस्वीर अपलोड नहीं हुई')}</td><td>{valid?`${r.grade} / 4 — ${labels[r.grade]}`:t('No grade issued','ग्रेड जारी नहीं हुआ')}</td><td>{valid&&Number.isFinite(r.confidence)?`${(r.confidence*100).toFixed(1)}%`:'—'}</td></tr>})}</tbody></table>
 {eyes.map(side=>{const eye=doc.eyes?.[side];if(!eye)return <section className="pdf-eye-section pdf-missing-eye" key={side}><h2>{side==='left'?t('Left eye','बाईं आँख'):t('Right eye','दाईं आँख')}</h2><p>{t('No image has been uploaded for this eye. Upload and analyze this eye to include its grade, original image, heatmap and segmentation.','इस आँख की तस्वीर अपलोड नहीं हुई है। ग्रेड, मूल तस्वीर, हीटमैप और सेगमेंटेशन के लिए इस आँख की तस्वीर अपलोड करके विश्लेषण करें।')}</p></section>;const r=eye.result||{},findings=visibleFindings(eye),valid=r.status==='analyzed'&&Number.isInteger(r.grade)&&r.grade>=0&&r.grade<=4,doctorGrade=doc.review?.eyeGrades?.[side],name=side==='left'?t('Left eye','बाईं आँख'):t('Right eye','दाईं आँख');return <section className="pdf-eye-section" key={side}>
 <h2>{name} · {t('Diabetic Retinopathy','डायबिटिक रेटिनोपैथी')}</h2>
 <div className="pdf-result"><div><span>{t('AI-predicted grade','AI अनुमानित ग्रेड')}</span><strong>{valid?`${r.grade} / 4 — ${labels[r.grade]}`:t('No grade issued','ग्रेड जारी नहीं हुआ')}</strong></div><div><span>{t('Highest model score','सबसे अधिक मॉडल स्कोर')}</span><strong>{valid&&Number.isFinite(r.confidence)?`${(r.confidence*100).toFixed(1)}%`:'—'}</strong></div><div><span>{t('Doctor review','डॉक्टर समीक्षा')}</span><strong>{doc.review?t('Recorded','दर्ज'):t('Pending','लंबित')}</strong></div></div>
 <p>{t('Screening status','स्क्रीनिंग स्थिति')}: {statusName(r.status||'unavailable',lang)} · {t('Analyzed','विश्लेषण')}: {date(eye.analyzedAt,lang)}</p>
 <table className="pdf-scores"><thead><tr><th>{t('Grade','ग्रेड')}</th><th>{t('Classification','वर्गीकरण')}</th><th>{t('Model score','मॉडल स्कोर')}</th></tr></thead><tbody>{labels.map((label,i)=><tr key={i} className={valid&&r.grade===i?'pdf-selected':''}><td>{i}</td><td>{label}{valid&&r.grade===i?' ← '+t('AI prediction','AI अनुमान'):''}</td><td>{Number.isFinite(r.probabilities?.[i])?`${(r.probabilities[i]*100).toFixed(1)}%`:'—'}</td></tr>)}</tbody></table>
 <p className="pdf-note">{t('Scores are uncalibrated model outputs, not verified diagnostic confidence. Grade 0 does not rule out eye disease.','स्कोर अंशांकित चिकित्सकीय विश्वसनीयता नहीं हैं। ग्रेड 0 से सभी नेत्र रोग खारिज नहीं होते।')}</p>
 <div className="pdf-three-images"><PrintImage eye={eye} mode="original" title={t('Original retinal image','मूल रेटिना तस्वीर')}/><PrintImage eye={eye} mode="heatmap" title={t('Grad-CAM heatmap','ग्रैड-कैम हीटमैप')}/><PrintImage eye={eye} mode="segmentation" title={t('Image segmentation','इमेज सेगमेंटेशन')}/></div>
 <div className="pdf-legend">{Object.entries(lesionCategories).filter(([code])=>code!=='OTHER').map(([code,c])=><span key={code}><i style={{background:c.color}}/>{lang==='hi'?c.hi:c.name}: {findings.filter(f=>f.category===code).length}</span>)}</div>
 <p className="pdf-note">{t('Counts describe displayed regions only. Dashed boxes: AI candidates; solid boxes: saved reviewer annotations. Grad-CAM shows model attention, not lesion boundaries.','संख्या केवल दिखाए क्षेत्रों की है। टूटी रेखा: AI संभावित क्षेत्र; ठोस रेखा: सहेजे समीक्षक चिह्न। ग्रैड-कैम ध्यान दिखाता है, घाव की सीमा नहीं।')}</p>
 {findings.some(f=>f.source!=='model')&&<div><h3>{t('Reviewer findings','चिह्नित निष्कर्ष')}</h3><ul>{findings.filter(f=>f.source!=='model').map(f=><li key={f.key}>{f.key}: {f.label||lesionCategories[f.category]?.name} · {f.source==='doctor-confirmed'?t('Doctor-confirmed annotation','डॉक्टर-पुष्ट चिह्न'):t('Reviewer annotation — pending confirmation','समीक्षक चिह्न — पुष्टि लंबित')}</li>)}</ul></div>}
 <p><b>{t('Image quality','तस्वीर की गुणवत्ता')}: </b>{r.quality?`${r.quality.accepted?t('Accepted','स्वीकार्य'):t('Retake needed','दोबारा तस्वीर लें')} · ${t('Sharpness','स्पष्टता')} ${r.quality.sharpness??'—'} · ${t('Brightness','चमक')} ${r.quality.brightness??'—'}`:'—'}</p>
 {r.quality?.reasons?.length>0&&<p>{r.quality.reasons.join(' ')}</p>}
 <h3>{t('Explanation and next steps','विवरण और अगले कदम')}</h3>{patientGuidance(eye,doc.review,side,lang).map((line,i)=><p key={i}>{line}</p>)}
 {Number.isInteger(doctorGrade)&&<p><b>{t('Doctor-recorded grade','डॉक्टर द्वारा दर्ज ग्रेड')}: </b>{doctorGrade} / 4 — {labels[doctorGrade]}</p>}

 <p className="pdf-note">{t('Model version','मॉडल संस्करण')}: {r.modelVersion||'—'}</p>
 </section>})}
 <section className="pdf-clinical"><h2>{t('Clinical review','चिकित्सकीय समीक्षा')}</h2>{doc.review?<><p><b>{t('Reviewer','समीक्षक')}: </b>{doc.review.reviewer} · {date(doc.review.reviewedAt||doc.review.createdAt,lang)}</p><p><b>{t('Assessment','आकलन')}: </b>{doc.review.assessment==='refer'?t('Referral advised','रेफरल की सलाह'):doc.review.assessment==='routine'?t('Routine follow-up','नियमित अनुवर्ती जाँच'):t('Unable to assess','आकलन संभव नहीं')}</p>{doc.review.notes&&<p>{doc.review.notes}</p>}{doc.review.urgencyDays&&<p>{t('Review within days','इन दिनों में समीक्षा')}: {doc.review.urgencyDays}</p>}</>:<p>{t('Pending. No doctor-confirmed diagnosis has been recorded.','लंबित। डॉक्टर-पुष्ट निदान दर्ज नहीं हुआ है।')}</p>}</section>
 {doc.referral&&<section className="pdf-clinical"><h2>{t('Appointment / referral','अपॉइंटमेंट / रेफरल')}</h2><p>{hospital?.name||doc.referral.facilityName||'—'} · {doc.referral.date} {doc.referral.appointmentTime}</p><p>{statusName(doc.referral.appointmentStatus||'requested',lang)}</p><p>{hospital?.address} {hospital?.phone}</p>{doc.referral.needsReReview&&<p>{t('Review changed. Reconfirm the referral before use.','समीक्षा बदली है। उपयोग से पहले रेफरल की दोबारा पुष्टि करें।')}</p>}</section>}
 <footer className="pdf-footer">{t('Generated','जारी')}: {date(new Date().toISOString(),lang)} · {t('A qualified eye doctor should confirm clinical findings.','योग्य नेत्र चिकित्सक निष्कर्षों की पुष्टि करें।')}</footer>
 </article>;
}
