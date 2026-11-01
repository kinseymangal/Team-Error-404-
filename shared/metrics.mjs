export function classificationMetrics(rows){
 if(!rows.length)throw new Error('No evaluated images');
 const confusion=Array.from({length:5},()=>Array(5).fill(0));
 for(const {actual,predicted} of rows){if(!Number.isInteger(actual)||actual<0||actual>4||!Number.isInteger(predicted)||predicted<0||predicted>4)throw new Error('Grades must be integers 0–4');confusion[actual][predicted]++;}
 const supports=confusion.map(r=>r.reduce((a,b)=>a+b,0)),counts=confusion.map((_,i)=>confusion.reduce((n,r)=>n+r[i],0)),n=rows.length;
 const perClass=supports.map((support,i)=>{const precision=counts[i]?confusion[i][i]/counts[i]:0,recall=support?confusion[i][i]/support:0;return {grade:i,support,predictedCount:counts[i],precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};});
 let observed=0,expected=0;for(let a=0;a<5;a++)for(let b=0;b<5;b++){const w=(a-b)**2/16;observed+=w*confusion[a][b]/n;expected+=w*supports[a]*counts[b]/n**2;}
 return {images:n,confusionMatrix:confusion,axes:'rows: expert grade; columns: predicted grade',perClass,macroF1:perClass.reduce((s,c)=>s+c.f1,0)/5,accuracy:confusion.reduce((s,r,i)=>s+r[i],0)/n,quadraticWeightedKappa:expected?1-observed/expected:null,missingClasses:supports.flatMap((n,i)=>n?[]:[i]),warning:supports.some(n=>!n)?'Some classes are absent; five-class performance is not established.':null};
}
