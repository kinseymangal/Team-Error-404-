import {homeTranslations} from './home-translations.mjs';
import React,{createContext,useContext} from 'react';
export const LanguageContext=createContext('en');
export function useT(){const lang=useContext(LanguageContext);return (en,hi)=>lang==='hi'?hi:(homeTranslations[lang]?.[en]??en);}
export function useLanguage(){return useContext(LanguageContext);}
export const daysByLanguage={en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],hi:['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि']};
export function statusName(value,lang){const names={requested:['Request saved — contact hospital','अनुरोध सहेजा — अस्पताल से संपर्क करें'],confirmed:['Hospital confirmation recorded','अस्पताल की पुष्टि दर्ज'],cancelled:['Cancelled','रद्द'],planned:['Planned','योजनाबद्ध'],attended:['Attended','पहुँचे'],missed:['Missed','नहीं पहुँचे'],planning:['Planning','योजना जारी'],arranged:['Transport arranged','यातायात व्यवस्थित'],analyzed:['Analyzed','विश्लेषित'],retake:['Retake needed','दोबारा तस्वीर लें']};return names[value]?.[lang==='hi'?1:0]||value;}
