# नेत्रिव — Offline Question Library
90 prepared English/Hindi questions and answers. These explain current project features; they are not personalized medical advice.

## Getting started

### What is Netriv?
नेत्रिव is a research retinal-screening workspace connecting uploaded retinal images, AI screening, doctor review and care coordination.

**नेत्रिव क्या है?**
नेत्रिव शोध आधारित रेटिना स्क्रीनिंग कार्यक्षेत्र है जो तस्वीर, AI स्क्रीनिंग, डॉक्टर समीक्षा और देखभाल समन्वय जोड़ता है।

### Who can use this project?
Patients, registered doctors and deployment administrators have different account permissions.

**इस प्रोजेक्ट का उपयोग कौन कर सकता है?**
मरीज, पंजीकृत डॉक्टर और व्यवस्थापक की अलग-अलग अनुमतियाँ हैं।

### Is Netriv a final diagnosis?
No. AI output is a screening suggestion requiring a qualified doctor's assessment.

**क्या नेत्रिव अंतिम निदान देता है?**
नहीं। AI परिणाम स्क्रीनिंग सुझाव है; योग्य डॉक्टर का आकलन आवश्यक है।

### How do I begin screening?
Log in, select Screen a patient, register or choose a patient record, then upload retinal photographs.

**स्क्रीनिंग कैसे शुरू करूँ?**
लॉग इन करें, मरीज की स्क्रीनिंग खोलें, मरीज पंजीकृत करें या चुनें और रेटिना तस्वीरें अपलोड करें।

### How do I return to the home page?
Select Camp overview in the sidebar, the नेत्रिव logo, or Home in the footer.

**होम पेज पर कैसे लौटूँ?**
साइडबार का Camp overview, नेत्रिव लोगो या फुटर का Home चुनें।

### Where is About us?
Scroll below the patient records on the home page, or choose About us in the footer.

**हमारे बारे में कहाँ है?**
होम पर मरीज रिकॉर्ड के नीचे जाएँ या फुटर का About us चुनें।

### Can I use the app on my phone?
The interface adapts to smaller screens. Your browser must be able to reach the running app server.

**क्या फोन पर ऐप उपयोग कर सकता हूँ?**
इंटरफ़ेस छोटी स्क्रीन के अनुसार बदलता है। ब्राउज़र को चलते ऐप सर्वर तक पहुँच चाहिए।

### Does the chatbot need an API key?
No. This assistant uses prepared project guidance locally. It does not call an external AI provider.

**क्या चैटबॉट को API कुंजी चाहिए?**
नहीं। यह सहायक स्थानीय तैयार प्रोजेक्ट मार्गदर्शन उपयोग करता है और बाहरी AI प्रदाता को कॉल नहीं करता।

### Can the assistant answer every question?
It answers supported project questions from its knowledge library. It cannot reliably answer every possible question.

**क्या सहायक हर सवाल का जवाब देता है?**
यह ज्ञान सूची के समर्थित प्रोजेक्ट सवालों का जवाब देता है। हर संभव सवाल का विश्वसनीय जवाब नहीं दे सकता।

### Does chatbot use cost money?
There is no external AI API cost for this offline assistant. Hosting and internet costs, if any, are separate.

**क्या चैटबॉट उपयोग का शुल्क है?**
इस ऑफलाइन सहायक की बाहरी AI API लागत नहीं है। होस्टिंग और इंटरनेट की लागत अलग हो सकती है।

## Accounts and privacy

### How do I create a patient account?
On the login page select Create account, choose Patient, enter your name, email and password, then register.

**मरीज का खाता कैसे बनाऊँ?**
लॉगिन पेज पर Create account चुनें, Patient चुनकर नाम, ईमेल और पासवर्ड भरें और पंजीकरण करें।

### How long must my password be?
Patient and doctor registration requires at least six characters. Administrator setup requires at least twelve.

**पासवर्ड कितना लंबा हो?**
मरीज और डॉक्टर के पासवर्ड में कम से कम छह अक्षर चाहिए। व्यवस्थापक सेटअप में बारह चाहिए।

### How do I log out?
Use Log out in the top bar. It ends your server session and reloads the login screen.

**लॉग आउट कैसे करूँ?**
ऊपर Log out चुनें। इससे सर्वर सत्र समाप्त होकर लॉगिन स्क्रीन खुलती है।

### What if my password is forgotten?
Self-service password reset email is not implemented. Contact your deployment administrator; do not share your password in chat.

**पासवर्ड भूल जाऊँ तो क्या करूँ?**
स्वयं पासवर्ड रीसेट ईमेल अभी उपलब्ध नहीं है। व्यवस्थापक से संपर्क करें; चैट में पासवर्ड न लिखें।

### Why is my login rejected?
Check that the email and password match the registered account and that the app server is running. Repeated attempts can be rate-limited.

**लॉगिन अस्वीकार क्यों है?**
पंजीकृत ईमेल-पासवर्ड और चलते सर्वर की जाँच करें। बार-बार प्रयास पर सीमा लग सकती है।

### Can patients see other patients' records?
Patient access is restricted to records owned by their account.

**क्या मरीज अन्य मरीजों के रिकॉर्ड देख सकते हैं?**
मरीज केवल अपने खाते के रिकॉर्ड देख सकते हैं।

### Can every doctor see all records?
No. A verified doctor needs the patient's authorization for the case. Registration alone does not grant access.

**क्या हर डॉक्टर सभी रिकॉर्ड देख सकता है?**
नहीं। सत्यापित डॉक्टर को केस की मरीज अनुमति चाहिए। केवल पंजीकरण से पहुँच नहीं मिलती।

### Is my password stored as plain text?
Passwords are stored using salted scrypt hashes, not readable passwords.

**क्या पासवर्ड सीधे पाठ में सहेजा जाता है?**
पासवर्ड salted scrypt hash से सहेजे जाते हैं, पढ़ने योग्य पासवर्ड के रूप में नहीं।

### Can I send patient details to this chatbot?
Avoid personal identifiers. The assistant does not need patient names, phone numbers or retinal images to explain app features.

**क्या चैट में मरीज जानकारी भेजूँ?**
निजी पहचान न भेजें। ऐप समझाने के लिए सहायक को मरीज का नाम, फोन या तस्वीर नहीं चाहिए।

### Does the chatbot access my reports?
No. This help assistant reads prepared FAQ entries, not patient records, retinal images or prescriptions.

**क्या चैटबॉट मेरी रिपोर्ट देखता है?**
नहीं। सहायक तैयार FAQ पढ़ता है, मरीज रिकॉर्ड, रेटिना तस्वीर या प्रिस्क्रिप्शन नहीं।

## Screening and uploads

### What type of image should I upload?
Upload a retinal fundus photograph captured with suitable eye-imaging equipment.

**कौन सी तस्वीर अपलोड करूँ?**
उचित नेत्र इमेजिंग उपकरण से ली गई रेटिना फंडस तस्वीर अपलोड करें।

### Can I upload an ordinary selfie of my eye?
A selfie of the outside of an eye is not a retinal fundus photograph and is unsuitable for this screening pipeline.

**क्या आँख की सामान्य सेल्फी अपलोड कर सकता हूँ?**
आँख के बाहर की सेल्फी रेटिना फंडस तस्वीर नहीं है और इस स्क्रीनिंग के लिए उचित नहीं है।

### Which image formats are accepted?
The upload interface accepts JPEG, PNG and WebP, up to 15 MB per file.

**कौन से तस्वीर प्रारूप स्वीकार हैं?**
JPEG, PNG और WebP स्वीकार हैं; हर फ़ाइल अधिकतम 15 MB हो सकती है।

### Why should both eyes be uploaded?
Each eye is processed separately, and the current doctor-review workflow requires photographs for both eyes.

**दोनों आँखों की तस्वीर क्यों चाहिए?**
हर आँख अलग विश्लेषित होती है; वर्तमान डॉक्टर समीक्षा प्रक्रिया में दोनों आँखों की तस्वीर चाहिए।

### What do OS and OD mean here?
OS labels the left eye and OD labels the right eye in the upload interface.

**यहाँ OS और OD क्या हैं?**
अपलोड में OS बाईं आँख और OD दाईं आँख दर्शाते हैं।

### How do I upload a photograph?
Choose or register a patient, select the left or right upload box, pick a supported image, then choose Analyze images.

**तस्वीर कैसे अपलोड करूँ?**
मरीज चुनें या पंजीकृत करें, बाईं या दाईं अपलोड जगह चुनें, तस्वीर चुनकर Analyze images दबाएँ।

### Why is Analyze images disabled?
Select a patient and at least one file, wait for any active operation, and select Diabetic Retinopathy. Other disease models are coming soon.

**Analyze images बटन बंद क्यों है?**
मरीज और कम से कम एक फ़ाइल चुनें, चलती प्रक्रिया पूरी होने दें और Diabetic Retinopathy चुनें। अन्य मॉडल जल्द आएँगे।

### What does Retake needed mean?
The image failed the app's heuristic quality checks. Upload a clearer, properly exposed retinal photo; no disease grade is issued for that rejected image.

**दोबारा तस्वीर लें का क्या अर्थ है?**
तस्वीर ऐप की अनुमान आधारित गुणवत्ता जाँच में विफल है। स्पष्ट, उचित रोशनी की रेटिना तस्वीर दें; अस्वीकृत तस्वीर को रोग ग्रेड नहीं मिलता।

### Do different photos run independently?
Yes. Each upload is processed separately with its own image hash, model output, heatmap and segmentation results.

**क्या अलग तस्वीरें अलग विश्लेषित होती हैं?**
हाँ। हर अपलोड का अलग हैश, मॉडल परिणाम, हीटमैप और विभाजन बनता है।

### Does uploading an image train the AI?
No. Uploading performs inference. An upload is not automatically a correct training label and does not automatically retrain or deploy a model.

**क्या तस्वीर अपलोड से AI प्रशिक्षित होता है?**
नहीं। अपलोड से अनुमान बनता है। वह स्वतः सही प्रशिक्षण लेबल नहीं बनता और मॉडल स्वतः प्रशिक्षित या लागू नहीं होता।

## Grades and reports

### What do the five DR grades mean?
0: no apparent DR; 1: mild NPDR; 2: moderate NPDR; 3: severe NPDR; 4: proliferative DR. These are AI screening suggestions until clinically reviewed.

**पाँच DR ग्रेड का क्या अर्थ है?**
0: स्पष्ट DR नहीं; 1: हल्का NPDR; 2: मध्यम NPDR; 3: गंभीर NPDR; 4: प्रोलिफेरेटिव DR। चिकित्सकीय समीक्षा तक ये AI स्क्रीनिंग सुझाव हैं।

### Does grade zero mean my eyes are healthy?
No. A grade 0 screening does not rule out diabetic retinopathy or other eye conditions. Follow your doctor's examination advice.

**क्या ग्रेड शून्य का मतलब आँख स्वस्थ है?**
नहीं। ग्रेड 0 से DR या अन्य नेत्र रोग खारिज नहीं होते। डॉक्टर की जाँच सलाह मानें।

### Does a high model score prove the diagnosis?
No. The displayed maximum softmax score is uncalibrated. A high score is not independently validated diagnostic confidence.

**क्या ऊँचा मॉडल स्कोर निदान साबित करता है?**
नहीं। दिखाया गया अधिकतम softmax स्कोर अंशांकित नहीं है। ऊँचा स्कोर सत्यापित निदान भरोसा नहीं है।

### Why do different images receive the same grade?
Different images can legitimately share a class. Repeated grades alone do not prove stale results, but accuracy needs evaluation against independent expert labels.

**अलग तस्वीरों को एक ग्रेड क्यों मिलता है?**
अलग तस्वीरें एक श्रेणी की हो सकती हैं। एक ग्रेड आना पुराने परिणाम का प्रमाण नहीं है; सटीकता की स्वतंत्र विशेषज्ञ लेबल से जाँच चाहिए।

### Where can I view older reports?
Select the patient's case from the available case records and open Image reports. Records are scoped to your account permissions.

**पुरानी रिपोर्ट कहाँ देखें?**
उपलब्ध केस रिकॉर्ड से मरीज का केस चुनें और तस्वीर रिपोर्ट खोलें। रिकॉर्ड खाते की अनुमति अनुसार दिखते हैं।

### How do I download a report PDF?
Open Image reports, choose Print / save PDF and select Save as PDF in your browser print dialog.

**रिपोर्ट PDF कैसे डाउनलोड करूँ?**
तस्वीर रिपोर्ट खोलें, Print / save PDF चुनें और ब्राउज़र प्रिंट में Save as PDF चुनें।

### What is the difference between AI grade and doctor assessment?
The AI grade is a model suggestion. The doctor's recorded assessment is a separate clinical review and may disagree with the AI.

**AI ग्रेड और डॉक्टर आकलन में अंतर क्या है?**
AI ग्रेड मॉडल सुझाव है। डॉक्टर का दर्ज आकलन अलग चिकित्सकीय समीक्षा है और AI से अलग हो सकता है।

### Does Netriv detect glaucoma and AMD now?
No. Their cards say Coming soon. The available disease-classification pipeline is for diabetic retinopathy.

**क्या अभी ग्लूकोमा और AMD पहचाने जाते हैं?**
नहीं। उनके कार्ड Coming soon दिखाते हैं। उपलब्ध रोग वर्गीकरण डायबिटिक रेटिनोपैथी का है।

### Can the assistant confirm my grade from chat?
No. The assistant cannot inspect your retinal image or confirm a diagnosis. Share the actual case with an authorized doctor.

**क्या सहायक चैट से मेरा ग्रेड पुष्टि कर सकता है?**
नहीं। सहायक आपकी रेटिना तस्वीर नहीं देखता या निदान पुष्टि नहीं करता। वास्तविक केस अधिकृत डॉक्टर से साझा करें।

### Is the AI clinically validated for my population?
Independent local clinical validation has not been completed. Functional tests passing does not establish medical accuracy.

**क्या AI मेरी आबादी के लिए चिकित्सकीय सत्यापित है?**
स्वतंत्र स्थानीय चिकित्सकीय सत्यापन पूरा नहीं हुआ है। तकनीकी परीक्षण सफल होना चिकित्सकीय सटीकता का प्रमाण नहीं।

## Heatmap and segmentation

### What does the heatmap show?
Grad-CAM highlights regions that influenced the classifier. It is a coarse attention map and not a precise lesion boundary.

**हीटमैप क्या दिखाता है?**
Grad-CAM वर्गीकरण को प्रभावित करने वाले क्षेत्र दिखाता है। यह मोटा ध्यान मानचित्र है, सटीक घाव सीमा नहीं।

### Is the heatmap a segmentation mask?
No. Heatmap attention and pixel-level lesion segmentation are different outputs from different model operations.

**क्या हीटमैप विभाजन मास्क है?**
नहीं। हीटमैप ध्यान और पिक्सेल घाव विभाजन अलग मॉडल प्रक्रियाओं के अलग परिणाम हैं।

### Which lesion categories can segmentation show?
The pretrained segmenter predicts microaneurysms, hemorrhages, hard exudates and soft exudates as suspected regions.

**विभाजन कौन से घाव दिखा सकता है?**
प्रीट्रेंड मॉडल सूक्ष्म रक्तवाहिका उभार, रक्तस्राव, हार्ड और सॉफ्ट एक्स्यूडेट के संभावित क्षेत्र बताता है।

### What do the segmentation colors mean?
Red: microaneurysms; orange: hemorrhages; yellow: hard exudates; green: soft exudates. These are suspected categories, not confirmed findings.

**विभाजन के रंग क्या दर्शाते हैं?**
लाल: सूक्ष्म रक्तवाहिका उभार; नारंगी: रक्तस्राव; पीला: हार्ड एक्स्यूडेट; हरा: सॉफ्ट एक्स्यूडेट। ये संभावित श्रेणियाँ हैं, पुष्ट निष्कर्ष नहीं।

### Why is segmentation blank?
There may be no supported predicted regions, unavailable output or a withheld broad mask. An empty display does not prove absence of disease.

**विभाजन खाली क्यों है?**
समर्थित अनुमानित क्षेत्र न हों, परिणाम उपलब्ध न हो या बड़ा मास्क छिपाया गया हो सकता है। खाली दृश्य रोग न होने का प्रमाण नहीं।

### How do I update segmentation on an old report?
Open Image Segmentation and choose Run AI segmentation. It uses the saved photo and invalidates the old review, so the new result needs review again.

**पुरानी रिपोर्ट का विभाजन कैसे बदलूँ?**
इमेज सेगमेंटेशन में Run AI segmentation चुनें। सहेजी तस्वीर उपयोग होगी और पुरानी समीक्षा निष्क्रिय होगी; नए परिणाम की दोबारा समीक्षा चाहिए।

### Can I adjust overlay transparency?
Use Mask opacity in segmentation, or the opacity control on the heatmap tab.

**क्या परत की पारदर्शिता बदल सकता हूँ?**
विभाजन में Mask opacity या हीटमैप टैब का गहराई नियंत्रण उपयोग करें।

### Where do magnified crops come from?
Crops are taken from the same uploaded photograph around supported model regions or saved doctor annotations.

**बड़े कटआउट कहाँ से आते हैं?**
कटआउट उसी अपलोड तस्वीर से समर्थित मॉडल क्षेत्र या सहेजे डॉक्टर चिह्न के आसपास बनते हैं।

### Are lesion counts exact?
No. Counts refer to displayed connected regions, with display limits and possible false positives or missed lesions.

**क्या घावों की संख्या सटीक है?**
नहीं। संख्या दिखाए गए जुड़े क्षेत्रों की है; प्रदर्शन सीमा, गलत पहचान या छूटे घाव हो सकते हैं।

### Why is one category hidden but others visible?
The display guards can withhold an unusually broad mask for one category while retaining supported output in other categories.

**एक श्रेणी छिपी और अन्य क्यों दिखती हैं?**
प्रदर्शन जाँच एक श्रेणी का बहुत बड़ा मास्क छिपाकर अन्य समर्थित परिणाम दिखा सकती है।

## Doctor review

### How does a doctor register?
Choose Create account and Doctor, then provide name, email, password, medical registration number, specialization, hospital and contact details.

**डॉक्टर पंजीकरण कैसे करें?**
Create account में Doctor चुनें और नाम, ईमेल, पासवर्ड, चिकित्सा पंजीकरण, विशेषज्ञता, अस्पताल तथा संपर्क भरें।

### Who verifies doctors?
A separately configured deployment administrator uses Doctor verification to review the registration and approve access.

**डॉक्टर का सत्यापन कौन करता है?**
अलग कॉन्फ़िगर व्यवस्थापक Doctor verification में पंजीकरण जाँचकर पहुँच स्वीकृत करता है।

### Why is no doctor listed for sharing?
Only registered, administrator-verified doctors appear. Ask your administrator to verify the doctor's account.

**साझा करने में डॉक्टर क्यों नहीं दिखता?**
केवल पंजीकृत और व्यवस्थापक-सत्यापित डॉक्टर दिखते हैं। व्यवस्थापक से डॉक्टर खाता सत्यापित कराएँ।

### How do I share a case with a doctor?
In the patient report/review screen, use Send for doctor review and select a verified doctor to grant access.

**डॉक्टर से केस कैसे साझा करूँ?**
मरीज रिपोर्ट या समीक्षा स्क्रीन के Send for doctor review में सत्यापित डॉक्टर चुनकर अनुमति दें।

### Can I share all existing reports?
Use Share all my existing reports with a listed verified doctor. This applies to existing owned cases; future cases are not automatically shared.

**क्या सभी मौजूदा रिपोर्ट साझा कर सकता हूँ?**
सूची के सत्यापित डॉक्टर के साथ Share all my existing reports चुनें। यह मौजूदा केस पर लागू है; भविष्य के केस स्वतः साझा नहीं होते।

### Can I revoke doctor access?
Uncheck the doctor in the case-sharing controls to revoke that doctor's access to that case.

**क्या डॉक्टर की पहुँच हटा सकता हूँ?**
उस केस की साझाकरण सूची में डॉक्टर अनचेक करके उस केस की पहुँच हटाएँ।

### Why cannot my doctor see my screening?
Confirm their account is verified and that your specific case has been shared with that doctor. Then refresh their queue.

**डॉक्टर मेरी स्क्रीनिंग क्यों नहीं देख पा रहे?**
डॉक्टर सत्यापन और उस विशेष केस की साझा अनुमति जाँचें। फिर उनकी सूची रीफ्रेश करें।

### Can an administrator review or prescribe?
Clinical review and prescriptions are restricted to verified doctors with access. Administrator role alone cannot perform these clinical actions.

**क्या व्यवस्थापक समीक्षा या दवा लिख सकता है?**
चिकित्सकीय समीक्षा और प्रिस्क्रिप्शन अनुमति प्राप्त सत्यापित डॉक्टर के लिए हैं। केवल व्यवस्थापक भूमिका से ये कार्य नहीं होते।

### Are AI findings approved automatically?
No. Doctor approval or rejection must be explicitly recorded after review.

**क्या AI निष्कर्ष स्वतः स्वीकृत होते हैं?**
नहीं। समीक्षा के बाद डॉक्टर को स्पष्ट स्वीकृति या अस्वीकृति दर्ज करनी होती है।

### Does doctor approval automatically train the model?
No. Approval alone does not retrain or deploy a model. Consent, verified labels and controlled dataset/model workflows are separate.

**क्या डॉक्टर स्वीकृति से मॉडल स्वतः प्रशिक्षित होता है?**
नहीं। स्वीकृति मात्र से मॉडल प्रशिक्षित या लागू नहीं होता। सहमति, सत्यापित लेबल और नियंत्रित डेटा प्रक्रिया अलग हैं।

## Prescriptions and notifications

### Who can issue a prescription?
Only a verified doctor authorized for the case, after the required review. AI suggestions do not become prescriptions.

**प्रिस्क्रिप्शन कौन दे सकता है?**
केवल केस का अधिकृत सत्यापित डॉक्टर आवश्यक समीक्षा के बाद दे सकता है। AI सुझाव प्रिस्क्रिप्शन नहीं बनते।

### Where are my prescribed medicines?
Open Prescriptions and select your case to view doctor-issued medicines and instructions.

**मेरी लिखी दवाएँ कहाँ हैं?**
प्रिस्क्रिप्शन में अपना केस चुनकर डॉक्टर की दवाएँ और निर्देश देखें।

### What fields are in a prescription?
Medicine name, dosage, frequency, duration, instructions, clinical observations and optional follow-up date.

**प्रिस्क्रिप्शन में क्या विवरण है?**
दवा नाम, खुराक, आवृत्ति, अवधि, निर्देश, चिकित्सकीय टिप्पणी और वैकल्पिक अनुवर्ती तारीख।

### Can the chatbot change my dose?
No. Contact the prescribing doctor before changing a medicine or dose. The assistant cannot prescribe.

**क्या चैटबॉट मेरी खुराक बदल सकता है?**
नहीं। दवा या खुराक बदलने से पहले लिखने वाले डॉक्टर से संपर्क करें। सहायक दवा नहीं लिख सकता।

### How do I discontinue a prescription in the app?
The issuing doctor can record discontinuation with a reason. Patients cannot issue or discontinue prescriptions themselves.

**ऐप में प्रिस्क्रिप्शन कैसे बंद करें?**
लिखने वाला डॉक्टर कारण देकर बंद होना दर्ज कर सकता है। मरीज स्वयं प्रिस्क्रिप्शन जारी या बंद नहीं कर सकते।

### Can I print a prescription?
Use the prescription print action and your browser's print or Save as PDF option.

**क्या प्रिस्क्रिप्शन प्रिंट कर सकता हूँ?**
प्रिस्क्रिप्शन प्रिंट विकल्प और ब्राउज़र का प्रिंट या Save as PDF उपयोग करें।

### What notifications are available?
In-app updates cover report sharing, screening completion, doctor review and prescription changes.

**कौन सी सूचनाएँ आती हैं?**
ऐप सूचनाएँ रिपोर्ट साझाकरण, स्क्रीनिंग पूरी होने, डॉक्टर समीक्षा और प्रिस्क्रिप्शन बदलाव पर आती हैं।

### How do I mark notifications as read?
Open Notifications and use the mark-as-read action on your notification.

**सूचना पढ़ा हुआ कैसे करें?**
सूचनाएँ खोलकर अपनी सूचना पर पढ़ा हुआ चिह्नित करने का विकल्प चुनें।

### Do email or SMS reminders work?
Email, SMS, push and scheduled reminder delivery are not currently configured in this version.

**क्या ईमेल या SMS रिमाइंडर आते हैं?**
इस संस्करण में ईमेल, SMS, पुश और निर्धारित रिमाइंडर वितरण कॉन्फ़िगर नहीं हैं।

### Are medication reminders already scheduled?
No. Scheduled medication reminders remain unfinished; use your doctor's instructions and an appropriate reminder method.

**क्या दवा रिमाइंडर निर्धारित हैं?**
नहीं। निर्धारित दवा रिमाइंडर अधूरे हैं; डॉक्टर निर्देश और उचित याद दिलाने का तरीका उपयोग करें।

## Hospitals and appointments

### How many facilities are in the directory?
The initial directory seed contains 25 source-checked Indore facility listings. Administrators may add, edit or deactivate listings.

**अस्पताल सूची में कितने संस्थान हैं?**
प्रारंभिक सूची में इंदौर के 25 स्रोत-जाँचे संस्थान हैं। व्यवस्थापक जोड़, बदल या निष्क्रिय कर सकते हैं।

### How do I search hospitals?
Open Care directory and search by name or locality. Use speciality and facility-type filters to narrow results.

**अस्पताल कैसे खोजूँ?**
अस्पताल सूची में नाम या क्षेत्र से खोजें। विशेषज्ञता और संस्थान प्रकार के फ़िल्टर उपयोग करें।

### Can I filter retina services?
Choose Retina in the directory speciality filter. Call the facility to confirm the relevant specialist's availability.

**क्या रेटिना सेवाएँ फ़िल्टर कर सकता हूँ?**
विशेषज्ञता फ़िल्टर में Retina चुनें। संबंधित विशेषज्ञ की उपलब्धता फोन से पुष्टि करें।

### How do I see nearby hospitals?
Use my location enables straight-line distance sorting for facilities with source-backed coordinates. Other distances remain unavailable.

**नज़दीकी अस्पताल कैसे देखें?**
मेरा स्थान उपयोग करें से स्रोत-आधारित निर्देशांक वाले संस्थान सीधी दूरी अनुसार दिखते हैं। अन्य की दूरी उपलब्ध नहीं होती।

### Why are only some map pins visible?
Only facilities with source-backed coordinates receive pins. Other listings still offer address-based directions.

**मानचित्र में कुछ पिन ही क्यों हैं?**
स्रोत-आधारित निर्देशांक वाले संस्थान के ही पिन हैं। अन्य के पते से रास्ता देख सकते हैं।

### Does the directory verify live opening hours?
Listings cite checked public sources, not a live hospital connection. Call to confirm current hours and services.

**क्या सूची वर्तमान खुलने का समय पुष्टि करती है?**
सूची जाँचे सार्वजनिक स्रोत देती है, लाइव अस्पताल कनेक्शन नहीं। वर्तमान समय और सेवा फोन से पुष्टि करें।

### Does saving an appointment contact the hospital?
No. The local request is a coordination record. Call or use the official hospital link separately.

**अपॉइंटमेंट सहेजने से अस्पताल संपर्क होता है?**
नहीं। स्थानीय अनुरोध समन्वय रिकॉर्ड है। अलग से फोन या आधिकारिक अस्पताल लिंक उपयोग करें।

### Who confirms a hospital appointment?
The hospital must actually confirm it. An administrator can then record the supplied time and confirmation reference in the app.

**अस्पताल अपॉइंटमेंट की पुष्टि कौन करता है?**
वास्तविक पुष्टि अस्पताल करेगा। फिर व्यवस्थापक दिया समय और पुष्टि संदर्भ ऐप में दर्ज कर सकते हैं।

### Can I cancel a request?
The care workflow can cancel a local request. Contact the hospital separately to cancel any booking made with them.

**क्या अनुरोध रद्द कर सकता हूँ?**
देखभाल प्रक्रिया स्थानीय अनुरोध रद्द कर सकती है। अस्पताल की वास्तविक बुकिंग अलग से उनसे रद्द कराएँ।

### Can an administrator edit hospital listings?
Yes. An administrator can add, edit or deactivate directory entries and cite the details' verification source.

**क्या व्यवस्थापक अस्पताल सूची बदल सकते हैं?**
हाँ। व्यवस्थापक सूची जोड़, बदल या निष्क्रिय करके विवरण का सत्यापन स्रोत दे सकते हैं।

## Settings and troubleshooting

### How do I change the website language?
Use the Language selector at the top. English and Hindi are supported; Gujarati, Marathi and Bengali cover home/navigation and fall back to English elsewhere.

**वेबसाइट की भाषा कैसे बदलूँ?**
ऊपर भाषा चयन उपयोग करें। अंग्रेज़ी-हिन्दी उपलब्ध हैं; गुजराती, मराठी और बांग्ला होम-नेविगेशन पर हैं और अन्य जगह अंग्रेज़ी दिख सकती है।

### How do I enable dark mode?
Use the Dark mode or Light mode button in the top bar. Your preference is saved in the browser.

**डार्क मोड कैसे चालू करूँ?**
ऊपर Dark mode या Light mode बटन उपयोग करें। पसंद ब्राउज़र में सहेजी जाती है।

### Why do I still see the old website design?
Restart your app server after installing updates and press Ctrl+F5 to reload browser assets.

**पुराना डिज़ाइन क्यों दिख रहा है?**
अपडेट के बाद ऐप सर्वर पुनः शुरू करें और Ctrl+F5 से ब्राउज़र फ़ाइलें दोबारा लोड करें।

### How do I start the project locally?
In the project folder run npm.cmd run dev, wait for the ready message and open http://127.0.0.1:5173.

**प्रोजेक्ट स्थानीय कैसे शुरू करूँ?**
प्रोजेक्ट फ़ोल्डर में npm.cmd run dev चलाएँ, तैयार संदेश का इंतजार करें और http://127.0.0.1:5173 खोलें।

### What if the server says port already in use?
Stop the older app terminal with Ctrl+C before starting the project again. Avoid running competing app servers on the same port.

**पोर्ट पहले से उपयोग में हो तो?**
पुराने ऐप टर्मिनल को Ctrl+C से रोककर फिर शुरू करें। एक पोर्ट पर कई सर्वर न चलाएँ।

### Where is my data stored?
Records are in the configured MongoDB database. Uploaded retinal photographs are stored separately in the project uploads folder.

**मेरा डेटा कहाँ सहेजा है?**
रिकॉर्ड कॉन्फ़िगर MongoDB में हैं। अपलोड रेटिना तस्वीरें अलग प्रोजेक्ट uploads फ़ोल्डर में हैं।

### Does JSON export include original photos?
No. The export is not a complete image backup. Preserve the MongoDB data and uploads folder for a complete deployment backup.

**क्या JSON निर्यात में मूल तस्वीरें हैं?**
नहीं। निर्यात पूरी तस्वीर बैकअप नहीं है। पूर्ण बैकअप के लिए MongoDB और uploads सुरक्षित रखें।

### Can I run the offline chatbot without the local server?
No. Offline means no external AI service; your local app server and authenticated session must still be available.

**क्या स्थानीय सर्वर बिना ऑफलाइन चैट चलती है?**
नहीं। ऑफलाइन का अर्थ बाहरी AI सेवा नहीं है; स्थानीय ऐप सर्वर और लॉगिन सत्र आवश्यक हैं।

### Does the assistant save my chat history permanently?
The current chat messages stay in browser component memory for the open session. The prepared question-answer library is stored separately in MongoDB.

**क्या सहायक चैट इतिहास स्थायी सहेजता है?**
वर्तमान चैट संदेश खुले सत्र की ब्राउज़र मेमोरी में रहते हैं। तैयार सवाल-जवाब सूची अलग MongoDB में सहेजी जाती है।

### What should I do for sudden vision loss?
Seek immediate professional eye or emergency assessment. Do not wait for a screening result or this help assistant.

**अचानक दृष्टि कम हो तो क्या करूँ?**
तत्काल नेत्र चिकित्सक या आपातकालीन आकलन लें। स्क्रीनिंग या इस सहायक का इंतजार न करें।
