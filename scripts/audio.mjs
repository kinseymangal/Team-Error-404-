import {createEspeak,encodeWav} from '@spelling-creator/spellophone';
import fs from 'node:fs/promises';
await fs.mkdir('public/audio',{recursive:true});
const engine=await createEspeak({languages:['en','hi']});
const scripts={en:'This is a research screening result, not a final diagnosis. A doctor should review both eyes and advise the next step. Please confirm the clinic day and arrange transport or an escort if needed.',hi:'यह शोध का नमूना है। यह अंतिम निदान नहीं है। दोनों आँखों की तस्वीर की जाँच डॉक्टर से कराएँ। डॉक्टर की सलाह के अनुसार आगे की जाँच कराएँ। यात्रा से पहले अस्पताल का दिन और समय पक्का करें। जरूरत हो तो साथ जाने वाले व्यक्ति और वाहन की व्यवस्था करें।'};
for(const [language,text] of Object.entries(scripts)){engine.setVoice(language);const result=engine.synthesize(text,{rate:145});await fs.writeFile(`public/audio/${language}.wav`,encodeWav(result.samples,result.sampleRate));console.log(`${language}: ${result.duration.toFixed(1)} seconds of offline audio`);}
engine.dispose();await fs.writeFile('public/audio/scripts.json',JSON.stringify({engine:'eSpeak NG / Spellophone',scripts,reviewStatus:'Draft scripts; have a clinician and native Hindi speaker review before field use.'},null,2));
