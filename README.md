Question library update: 90 curated English/Hindi question-answer pairs in nine topic groups. Open Ask नेत्रिव → Question library to search, filter and browse questions. The server imports server/faq-seed.json into the MongoDB FAQ collection on first chat/library access. Repeated startup does not duplicate or overwrite existing entries. Chat matching reads the stored library; unsupported questions use bounded project help or a clear limitation response. No patient records or chat transcripts are added to the knowledge collection. A readable copy is included in docs/QUESTION_LIBRARY.md.

# Offline project-help chatbot
Click Ask नेत्रिव at the bottom-right after login. Local project guidance supports questions about uploads, DR grades, visualization, doctor sharing/verification, prescriptions, notifications, directory and settings. Quick prompts and related-page buttons are included, along with clear-chat and loading/error states.
This is a rule-based offline help assistant, not a generative AI model. It does not answer every possible question or access patient records. Answers are available in English and Hindi; other selected languages currently use English for help. No paid API, API key, external AI call, uploaded image or patient-record context is used. The local app server must remain running. Messages are kept only in component memory for the current open session and are cleared on logout/reload; no chat collection is stored in MongoDB. The authenticated endpoint has validation and rate limits.

Language update: Home, navigation, About Us and footer now support Gujarati (gu), Marathi (mr) and Bengali (bn), in addition to English and Hindi. The selector saves the preference across refreshes. New languages fall back to English on screens without translated text. Clinical report language and patient preferred language remain English/Hindi.

# नेत्रिव — visual theme update
The existing application now uses the supplied reference palette: ice blue, royal blue, white and navy, with rounded controls and elevated cards. Branding changed to नेत्रिव in the interface and printed reports. The supplied decorative eye video appears only on the home/dashboard page; login, signup and clinical pages contain no video. Pause/play and reduced-motion handling are included.
Existing API routes, authentication, local storage keys, model inference, database records, permissions and button actions are retained. The project directory and package name remain compatible with the previous installation.
Run npm.cmd run dev after restarting the server; refresh with Ctrl+F5. See TESTING.md for executed checks.

# Directory expansion — latest update
Care Directory now seeds 25 source-checked Indore facilities into MongoDB on first directory access. Administrator edits are preserved on restart; seeds never overwrite existing listings. Admins can add, edit or deactivate facilities. Patient records are unchanged.
Search names/localities/services, filter facility type/locality/speciality, paginate six cards per page, and switch to the OpenStreetMap view. Use my location enables straight-line distance sorting. Five listings currently have coordinates extracted from their official website map links. Other coordinates and distances are unavailable; no guessed pins are used. Map tiles need internet access.
Each listing includes its verification source and check date. Missing phone numbers/hours are shown as unavailable. Source-checking does not imply a phone call, a hospital partnership or live appointment availability. Dates for facilities with unpublished opening days require direct confirmation.
Run npm.cmd ci once after applying the update (Leaflet added), then npm.cmd run dev. Restart and Ctrl+F5. Full earlier documentation follows.

# NayanSetu — retinal viewer and three-disease module update

Existing React/Vite, Express, MongoDB, ONNX Runtime and TensorFlow.js architecture retained. No Flask service existed in the inspected project. Image operations use Sharp and normalized SVG coordinates; no OpenCV dependency is needed for this viewer.

## Run
Use Node.js 22.12+ or compatible newer version. In the extracted NayanSetu-MERN folder:
```
npm.cmd ci
npm.cmd run dev
```
Open http://127.0.0.1:5173 and create/log into an account. Production: `npm.cmd run build`, then `npm.cmd start` (default port 4000). First local launch may download MongoDB. Keep the server running.

## Updating your existing installation
Stop the existing server. Back up the folder. Merge archive contents into the existing NayanSetu-MERN folder and replace matching source files. Preserve .env, .runtime, uploads and data. Restart the server and press Ctrl+F5. Do not nest a second NayanSetu-MERN folder inside the first.

## Three disease modules
- Diabetic Retinopathy: existing five-class research grading model and pretrained MA/HE/EX/SE segmentation weights.
- Glaucoma: Model Not Configured. No optic cup/disc measurement or cup-to-disc ratio is invented.
- AMD: Model Not Configured. No drusen or macular findings are invented.
Backend rejects attempts to run the DR classifier under Glaucoma/AMD. Availability is obtained from /api/disease-models. Clinical context sources: https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma and https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/age-related-macular-degeneration

## Three viewer tabs
Original / Heatmap / Image Segmentation. Segmentation uses the uploaded photograph in the center, region-specific crops at the sides, coordinate-linked dotted lines, actual pixel masks when usable, bounding boxes, category toggles, region labels, a color legend and adjustable mask opacity. Crops are sampled from that same uploaded image. No random findings or stock lesion crops are used. Up to six magnified crops are shown; all supported regions remain marked.
Colors: microaneurysms red; hemorrhages orange; hard exudates yellow; soft exudates green. Soft-exudate AI weights are now included. Other doctor findings use blue. Counts mean marked regions, not a validated total number of lesions. Bounding boxes and doctor annotations are not pixel segmentation masks.

The old tiny demonstration segmenter has been replaced by ClementP's pretrained U-Net / SE-ResNeXt50, exported to ONNX and included under models/lesions-pretrained. Source: https://huggingface.co/ClementP/fundus-lesions-segmentation-unet_seresnext50_32x4d . MIT license and model card are included. Segmentation runs automatically on new uploads. For an existing report, open Image Segmentation and click Run AI segmentation. This uses its saved photograph and clears the stale review while preserving the previous review in the eye record. No Python installation is required to run the application.

AI masks, boxes and crops come from actual model outputs. A broad mask is withheld per category without hiding other localized categories. Regions remain suspected findings; no independent local clinical accuracy evaluation was performed. Some photos may still have no supported regions. Use original-resolution fundus images: downsampling/compression can substantially change model predictions.

Heatmaps use real classifier activations and analytical gradients through the classifier head, with coarse 7x7 spatial resolution. Display colors progress blue → yellow → red. Heatmaps show class attention, not precise lesion boundaries. Re-upload existing photos to regenerate old stored heatmaps; re-analysis clears old clinical review.

## Doctor workflow
See DOCTOR REVIEW WORKFLOW.md. Only verified, authorized doctors can save annotations, review cases and prescribe. Select a category, write the finding, drag over the central photograph to define its box, edit/remove existing labels as needed, and save. Annotations remain pending until an explicit findings decision is recorded in Doctor review. Approve/reject is never inferred from an AI score. Approved reference cases show only currently authorized cases. Rejected findings are hidden from localization display.

To create a deployment administrator: stop the server and run `node scripts/start-admin-setup.mjs`. Choose an unused administrator email and a 12+ character password. Log in and independently verify the doctor before approval. Patient/doctor registration allows 6+ characters. Existing accounts are not silently promoted.

## Existing functions retained
Account sessions and role restrictions, patient cases and uploads, sharing to verified doctors, prescriptions and discontinuation history, persistent in-app notifications, hospital contacts/appointment requests, transport coordination for administrators, Hindi/English, dark/light preference, browser-printable reports. No real patient data is shipped.

## Tests
`npm.cmd test`: 31 passed, 0 failed, 0 skipped in the final run. Includes actual ONNX inference on IDRiD_07 and IDRiD_55 (functional checks, not independent accuracy evaluation), per-image heatmap identity, crop bounds, category toggles, suppression of unreliable/rejected findings, unsupported disease rejection, doctor approval state, authenticated sharing/review/prescriptions and MongoDB persistence. `npm.cmd run build`: passed. Full browser visual verification has not been completed; these automated checks do not establish clinical accuracy.

## Outstanding features from the earlier master request
Validated Glaucoma/AMD models, independent clinical evaluation, password-reset email/profile tools, email/push notifications, scheduled medication reminders, LLM explanations, automatic training dataset governance, hospital booking integrations and a 20–25 listing directory remain incomplete. Do not treat this as a clinically validated production deployment.
