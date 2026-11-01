import { access } from 'node:fs/promises';
import path from 'node:path';
import { LABELS, NOTICE } from '../shared/constants.js';
import { decodeImage } from './images.js';
import { initializeTensorFlow, loadModel, predictPixels } from '../ml/model.js';

export class Engine {
  constructor({threshold=.7}={}) {
    if (!Number.isFinite(threshold)||threshold<0||threshold>1) throw new Error('MODEL_THRESHOLD must be in [0,1].');
    this.threshold=threshold;this.loaded=null;this.error=null;
  }
  async load(directory) {
    try {await access(path.join(directory,'model.json'));}
    catch {return;}
    try {await initializeTensorFlow();this.loaded=await loadModel(directory);}
    catch(error) {console.error('Model load failed:',error.message);this.error='Model could not be loaded. Check its format, metadata and checksums.';}
  }
  status() {return {model_loaded:!!this.loaded,model_id:this.loaded?.id??null,labels:LABELS,
    threshold:this.threshold,error:this.error,clinically_validated:false};}
  async analyze(bytes,eye,confirmed) {
    const {pixels,quality,image_sha256}=await decodeImage(bytes);
    const result={eye,quality,image_sha256,operator_confirmed_fundus_and_quality:confirmed,
      status:'not_assessed',level:null,label:null,scores:null,model_id:this.loaded?.id??null,
      message:this.error??'No trained weights installed. No disease inference was performed.'};
    if (!quality.technical_check_passed) return {...result,status:'recapture',message:'Technical image checks failed. Review or recapture.'};
    if (!confirmed) return {...result,status:'review_required',message:'A trained operator must confirm fundus content and optic-disc visibility before inference.'};
    if (!this.loaded) return result;
    const scores=await predictPixels(this.loaded.model,pixels);
    if (scores.length!==5||scores.some(x=>!Number.isFinite(x))) throw new Error('Invalid model output');
    result.scores=scores.map((score,i)=>({level:i+1,label:LABELS[i],score}));
    const best=scores.indexOf(Math.max(...scores));
    if (scores[best]<this.threshold) return {...result,status:'uncertain',message:'Below the provisional research threshold. Specialist review required; no level assigned.'};
    return {...result,status:'research_prediction',level:best+1,label:LABELS[best],message:NOTICE+' Scores are uncalibrated model outputs.'};
  }
  dispose() {this.loaded?.model.dispose();this.loaded=null;}
}
