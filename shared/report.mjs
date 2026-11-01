export const lesionNames={SE:['Soft exudate candidate (cotton wool spot)','संभावित सॉफ्ट एक्स्यूडेट'],MA:['Microaneurysm candidate (tiny red spot)','सूक्ष्म रक्तवाहिका उभार का संभावित क्षेत्र (छोटा लाल बिंदु)'],HE:['Hemorrhage candidate (possible bleeding)','संभावित रक्तस्राव का क्षेत्र'],EX:['Exudate candidate (possible fatty deposit)','संभावित वसा जमाव का क्षेत्र']};
export const gradeLabels={en:['No apparent DR','Mild NPDR','Moderate NPDR','Severe NPDR','Proliferative DR'],hi:['स्पष्ट डायबिटिक रेटिनोपैथी नहीं','हल्की रेटिनोपैथी','मध्यम रेटिनोपैथी','गंभीर रेटिनोपैथी','प्रोलिफेरेटिव रेटिनोपैथी']};
// These are conservative display guards, not a validated segmentation quality metric.
export function maskSummary(masks={}) {
  const entries=Object.entries(masks);
  const suspiciousOverlap=entries.length===3&&entries.every(([,m])=>m.coveragePct>5)&&Math.max(...entries.map(([,m])=>m.coveragePct))-Math.min(...entries.map(([,m])=>m.coveragePct))<1;
  const suppressedCodes=entries.filter(([,m])=>suspiciousOverlap||Number(m.coveragePct)>15||m.suppressed).map(([code])=>code);
  const accepted=entries.filter(([code])=>!suppressedCodes.includes(code)),rejected=entries.length>0&&!accepted.length;
  return {status:!entries.length?'unavailable':rejected?'unreliable':suppressedCodes.length?'partial':'experimental',rejected,suppressedCodes,regions:accepted.flatMap(([code,m])=>(m.regions||[]).map(r=>({...r,code})))};
}
export function connectedRegions(mask,width,height,{minPixels=4,maxRegions=12}={}) {
  if(mask.length!==width*height)throw new Error('Mask dimensions do not match');
  const visited=new Uint8Array(mask.length),queue=new Int32Array(mask.length),regions=[];
  for(let start=0;start<mask.length;start++){
    if(!mask[start]||visited[start])continue;
    let head=0,tail=1,count=0,x0=width,y0=height,x1=0,y1=0;queue[0]=start;visited[start]=1;
    while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);count++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const n=ny*width+nx;if(mask[n]&&!visited[n]){visited[n]=1;queue[tail++]=n;}}
    }
    if(count>=minPixels)regions.push({x:(x0+x1+1)/2/width,y:(y0+y1+1)/2/height,rx:Math.max(6,(x1-x0+1)/2+3)/width,ry:Math.max(6,(y1-y0+1)/2+3)/height,pixels:count});
  }
  return regions.sort((a,b)=>b.pixels-a.pixels).slice(0,maxRegions);
}
export function explainEye(eye,review,side,lang='en') {
  const hi=lang==='hi',t=(en,h)=>hi?h:en,r=eye?.result;
  if(!r)return [t('Upload a photograph of this eye to create its report.','इस आँख की रिपोर्ट के लिए तस्वीर अपलोड करें।')];
  const sideName=t(side==='left'?'Left eye':'Right eye',side==='left'?'बाईं आँख':'दाईं आँख'),lines=[];
  if(r.status==='retake')lines.push(t(`${sideName}: image quality was insufficient; no disease grade was issued. Ask the operator to retake a clear, well-lit retinal photograph.`,`${sideName}: तस्वीर की गुणवत्ता पर्याप्त नहीं थी; रोग का ग्रेड नहीं दिया गया। ऑपरेटर से स्पष्ट, सही रोशनी वाली रेटिना तस्वीर दोबारा लेने को कहें।`));
  else {
    lines.push(t(`${sideName}: the AI suggests grade ${r.grade} — ${gradeLabels.en[r.grade]}. This is a screening suggestion, not a confirmed diagnosis.`,`${sideName}: AI का सुझाव ग्रेड ${r.grade} — ${gradeLabels.hi[r.grade]} है। यह जाँच का सुझाव है, पुष्टि किया हुआ निदान नहीं।`));
    const guidance=[
      ['The model did not suggest apparent diabetic retinopathy. This does not rule out other eye disease; keep the eye-examination schedule advised by your doctor.','मॉडल ने स्पष्ट डायबिटिक रेटिनोपैथी का संकेत नहीं दिया। अन्य नेत्र रोग फिर भी हो सकते हैं; डॉक्टर की बताई जाँच जारी रखें।'],
      ['The model suggests early changes. Have an eye doctor check this photograph and decide your follow-up schedule.','मॉडल शुरुआती बदलाव का संकेत देता है। नेत्र चिकित्सक से तस्वीर की जाँच और अगली जाँच का समय तय कराएँ।'],
      ['The model suggests moderate changes. Arrange an eye-doctor review to verify the grade and decide whether a retina consultation is needed.','मॉडल मध्यम बदलाव का संकेत देता है। ग्रेड की पुष्टि और रेटिना विशेषज्ञ की आवश्यकता तय करने के लिए नेत्र चिकित्सक की समीक्षा कराएँ।'],
      ['The model suggests severe changes. Contact an eye doctor promptly to confirm the finding and decide the urgency of specialist care.','मॉडल गंभीर बदलाव का संकेत देता है। पुष्टि और विशेषज्ञ देखभाल की तात्कालिकता तय करने के लिए जल्द नेत्र चिकित्सक से संपर्क करें।'],
      ['The model suggests advanced changes. Contact an eye doctor promptly for specialist assessment; the photograph alone cannot confirm new blood vessels or treatment needs.','मॉडल उन्नत बदलाव का संकेत देता है। विशेषज्ञ जाँच के लिए जल्द नेत्र चिकित्सक से संपर्क करें; केवल तस्वीर से नई रक्तवाहिकाओं या उपचार की आवश्यकता की पुष्टि नहीं होती।']
    ];lines.push(guidance[r.grade]?.[hi?1:0]||'');
    if(r.uncertain)lines.push(t('The model scores are spread across grades. A doctor must resolve this uncertainty.','मॉडल के स्कोर अलग-अलग ग्रेड में बँटे हैं। डॉक्टर की समीक्षा आवश्यक है।'));
    const s=maskSummary(r.masks);
    lines.push(s.status==='unreliable'?t('Automatic segmentation is unreliable for this image: broad or overlapping masks were suppressed. No automatic defect circles are shown. A reviewer can mark visible findings.','इस तस्वीर का स्वचालित विभाजन अविश्वसनीय है: बहुत बड़े या मिलते-जुलते मास्क छिपाए गए हैं। स्वतः दोष के गोले नहीं दिखाए गए। समीक्षक दिखाई देने वाले निष्कर्ष चिह्नित कर सकता है।'):s.status==='unavailable'?t('No segmentation output is available for this image.','इस तस्वीर के लिए विभाजन उपलब्ध नहीं है।'):t(`${s.regions.length} candidate regions are marked for review. They may be false positives or miss real lesions; no circles does not mean a healthy retina.`,`${s.regions.length} संभावित क्षेत्र समीक्षा के लिए चिह्नित हैं। ये गलत हो सकते हैं या वास्तविक घाव छूट सकते हैं; गोले न होना स्वस्थ रेटिना का प्रमाण नहीं है।`));
  }
  if(r.quality)lines.push(t(`Image measurements: sharpness ${r.quality.sharpness}, brightness ${r.quality.brightness}, usable field ${r.quality.coverage}%. These are heuristic checks.`,`तस्वीर माप: स्पष्टता ${r.quality.sharpness}, चमक ${r.quality.brightness}, उपयोगी क्षेत्र ${r.quality.coverage}%। ये अनुमान आधारित जाँच हैं।`));
  if(eye.annotations?.length)lines.push(t(`${eye.annotations.length} reviewer-drawn regions are saved. Read the numbered labels next to the image.`,`${eye.annotations.length} समीक्षक द्वारा चिह्नित क्षेत्र सहेजे गए हैं। तस्वीर के पास क्रमांकित विवरण पढ़ें।`));
  if(review){
    lines.push(t(`Reviewer ${review.reviewer}: ${review.assessment==='routine'?'routine follow-up':review.assessment==='unable'?'unable to assess':'specialist referral'}. Recorded case grade: ${review.grade??'not assessable'}. Follow-up window: ${review.urgencyDays} days from review.`,`समीक्षक ${review.reviewer}: ${review.assessment==='routine'?'नियमित अनुवर्ती जाँच':review.assessment==='unable'?'आकलन संभव नहीं':'विशेषज्ञ रेफरल'}। दर्ज केस ग्रेड: ${review.grade??'आकलन संभव नहीं'}। समीक्षा के बाद ${review.urgencyDays} दिन की समय सीमा।`));
    if(review.notes)lines.push(t(`Doctor notes: ${review.notes}`,`डॉक्टर के नोट्स: ${review.notes}`));
  }else lines.push(t('Doctor review is pending. Complete it before planning an appointment.','डॉक्टर की समीक्षा लंबित है। अपॉइंटमेंट योजना से पहले इसे पूरा करें।'));
  lines.push(t('For sudden vision loss or sudden new visual symptoms, seek urgent eye care rather than waiting for this report.','अचानक दृष्टि कम होने या नए अचानक दृष्टि लक्षणों पर इस रिपोर्ट का इंतजार किए बिना तत्काल नेत्र चिकित्सा लें।'));
  return lines.filter(Boolean);
}

export function patientGuidance(eye,review,side,lang='en'){
 const hi=lang==='hi',t=(a,b)=>hi?b:a,r=eye?.result;if(!r)return [];
 if(r.status==='retake')return [t('This photo is not clear enough to grade. Please upload a clearer retinal photo.','ग्रेड देने के लिए तस्वीर पर्याप्त स्पष्ट नहीं है। स्पष्ट रेटिना तस्वीर अपलोड करें।')];
 const advice=[['Keep the eye-check schedule recommended by your doctor.','डॉक्टर की बताई नियमित नेत्र जाँच जारी रखें।'],['Ask an eye doctor to review the possible early changes.','संभावित शुरुआती बदलाव की नेत्र चिकित्सक से जाँच कराएँ।'],['Arrange an eye-doctor review to confirm the suggested moderate changes.','सुझाए गए मध्यम बदलाव की पुष्टि के लिए नेत्र चिकित्सक से जाँच कराएँ।'],['Contact an eye doctor promptly to assess the suggested severe changes.','सुझाए गए गंभीर बदलाव की जाँच के लिए जल्द नेत्र चिकित्सक से संपर्क करें।'],['Contact an eye doctor promptly for specialist assessment of the suggested advanced changes.','सुझाए गए उन्नत बदलाव की विशेषज्ञ जाँच के लिए जल्द नेत्र चिकित्सक से संपर्क करें।']];
 const lines=[advice[r.grade]?.[hi?1:0]||t('Ask your doctor to review this result.','डॉक्टर से परिणाम की समीक्षा कराएँ।')];
 if(review?.findingsDecision==='rejected')lines.push(t('The doctor rejected the AI findings. Follow the doctor’s assessment and instructions.','डॉक्टर ने AI निष्कर्ष अस्वीकार किए हैं। डॉक्टर के आकलन और निर्देशों का पालन करें।'));
 if(review){lines.push(t(`Reviewed by ${review.reviewer}. ${review.assessment==='unable'?'The doctor could not assess this case.':review.assessment==='routine'?'Routine follow-up advised.':'Specialist review advised.'}`,`${review.reviewer} द्वारा समीक्षा। ${review.assessment==='unable'?'डॉक्टर इस केस का आकलन नहीं कर सके।':review.assessment==='routine'?'नियमित अनुवर्ती जाँच की सलाह है।':'विशेषज्ञ जाँच की सलाह है।'}`));if(review.notes)lines.push(t('Doctor’s advice: ','डॉक्टर की सलाह: ')+review.notes);}
 else lines.push(t('Doctor review is pending. Share this report with a verified doctor.','डॉक्टर समीक्षा लंबित है। रिपोर्ट सत्यापित डॉक्टर से साझा करें।'));
 return lines;
}
