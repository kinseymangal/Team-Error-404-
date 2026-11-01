import test from 'node:test';import assert from 'node:assert/strict';import {helpAnswer} from '../server/chat.mjs';
test('Offline help routes supported questions to actual app pages',()=>{
 for(const [message,page] of [['How to upload a photo?','screen'],['What is image segmentation?','report'],['What does grade 2 mean?','report'],['How do I share with a doctor?','review'],['Find an eye hospital','directory'],['How do I see my prescription?','prescriptions'],['Where are notifications?','notifications']]){const result=helpAnswer(message);assert.equal(result.mode,'project-help');assert.equal(result.actions[0].page,page);}
});
test('Unknown questions do not manufacture answers',()=>{const r=helpAnswer('Who will win the football final?');assert.match(r.answer,/does not have a verified answer/);assert.deepEqual(r.actions,[]);});
test('Emergency language does not delay professional assessment',()=>{assert.equal(helpAnswer('I have sudden vision loss').mode,'urgent-guidance');assert.match(helpAnswer('मुझे अचानक दृष्टि कम हो रही है','hi').answer,/तत्काल/);});
test('Hindi project help and medication boundaries are explicit',()=>{assert.match(helpAnswer('दवा की खुराक बदलें','hi').answer,/नहीं कर सकता/);assert.match(helpAnswer('डॉक्टर से रिपोर्ट साझा कैसे करें','hi').answer,/सत्यापन/);});

import fs from 'node:fs/promises';import {rankFAQs,faqResponse} from '../server/faq.mjs';
test('Every prepared English/Hindi question resolves to its own stored answer',async()=>{
 const rows=JSON.parse(await fs.readFile('server/faq-seed.json','utf8'));assert.equal(rows.length,90);assert.equal(new Set(rows.map(f=>f.id)).size,90);
 for(const f of rows){assert.equal(rankFAQs(rows,f.question)[0].faq.id,f.id);assert.equal(rankFAQs(rows,f.questionHi)[0].faq.id,f.id);assert.equal(faqResponse(f,'hi').answer,f.answerHi);assert.ok(f.answer&&f.answerHi&&f.category);}
 assert.equal(rankFAQs(rows,'Who wins the football tournament?').length,0);
});
