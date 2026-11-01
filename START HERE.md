# Open your NayanSetu prototype

1. Extract the entire ZIP into a folder. Do not run files from inside the ZIP preview.
2. Install **Node.js 24 LTS** from https://nodejs.org if it is not already installed.
3. Double-click **Open NayanSetu.cmd**.
4. Keep that command window open. The app opens in your default browser when ready.

If the browser does not open automatically, visit **http://127.0.0.1:4000**.

The first launch installs npm dependencies and downloads a MongoDB runtime, so it requires internet and may take several minutes. The MongoDB Windows download is approximately 600 MB. Afterwards, the installed app can run locally without internet. The ZIP includes the built React app, grading weights, experimental lesion weights, and Hindi/English audio; no Python is required.

## Try the prototype

1. Click **Try benchmark demo**. This creates a fictional case and loads the same IDRiD image into both eye slots; it is explicitly labelled as a demonstration, not a real patient pair.
2. Click **Analyze images** to run real local inference.
3. Switch between the left and right eyes, Grad-CAM, and the three predicted lesion layers. Download separate masks if needed.
4. Use **Test blur rejection**, then **Analyze images**, to see the retake request.
5. Load a usable image again before completing a normal review.
6. Open **Doctor review**. Record the reviewer name, findings and referral window.
7. Choose a suggested facility. In **Camp-to-Care**, print the referral card and record attendance or a missed visit.

For Hindi, register a patient with **हिन्दी / Hindi** selected. The explanation uses a bundled audio recording and works offline.

## Train with your data

Open **Training data** to import either:

- An APTOS subset ZIP containing `train.csv` and `train_images/<id_code>.png` at its root.
- A reviewed-image ZIP containing `labels.json` plus the referenced image files. The format is shown on the page.

The web upload supports ZIPs up to 500 MB. For the complete, larger APTOS dataset, extract it yourself and run:

```powershell
npm.cmd run import:aptos -- "C:\path\to\extracted-aptos"
```

For patient uploads, obtain separate training consent during registration. A reviewer must approve usable photographs and provide an individual grade for each eye in Doctor review. Demo cases are excluded. Names and other patient details are not model features.

Once there are at least 10 unique usable images, five groups and two grade classes, use **Train candidate from approved data**. Training adapts the final classification layer using frozen retinal features and saves a candidate with a validation report. It does not silently replace the active baseline. More data and independent evaluation are needed before promotion. For APTOS, patient identifiers are unavailable: the split uses image IDs and exact duplicate checks, which does not guarantee patient-independent evaluation.

## What is implemented and what remains experimental

- Real MERN application: MongoDB, Express, React and Node.js.
- Real local DR grading with third-party APTOS-trained ResNet-50 ONNX weights.
- Actual Grad-CAM computed from classifier activations and analytical gradients; it is separate from lesion segmentation.
- A tiny U-Net trained here in TensorFlow.js on six IDRiD training images, with two additional development images used for validation. **This lesion model performs poorly and is not suitable for diagnosis.** Threshold tuning produces substantial false positives. Inspect `models/lesions/training.json` for measured development results and limitations. Do not interpret a blank mask as absence of disease.
- Blur/exposure/coverage/colour checks are uncalibrated heuristics.
- Referral plans use fictional facilities and unconfirmed transport schedules. Nothing is booked.
- Every AI result requires doctor review. Reviewer name is an audit field; this prototype does not verify a clinician's identity.

No new grading model was trained from scratch on the full APTOS dataset during this build. No real patient uploads have been used for training.

## Local storage and sync

MongoDB stores records in `.runtime/mongo`; images remain in `uploads`. Keep both for a complete backup. The Settings export contains metadata and model results, not original image files. Do not share patient data in a public ZIP.

Without an external MongoDB URI, the app starts a real local MongoDB process using a persistent WiredTiger database. Its launcher library is named mongodb-memory-server-core, but this configuration uses a disk-backed database path.

The laptop can analyze images with internet disconnected. A disconnected browser can queue registrations in IndexedDB; image inference needs access to the camp laptop. The built frontend has a service worker for its visited shell/assets. On a hotspot served over plain HTTP, browser service-worker and secure-context features may be unavailable; the laptop server remains the durable offline store.

Remote sync is optional. Configure `SYNC_TARGET_URL` and `SYNC_TOKEN` in a `.env` file copied from `.env.example`. Both servers need the shared sync token; remote connections require HTTPS, except localhost testing. Sync sends consented records and derived model results; it does not upload original photographs. Conflicts remain for review. With no remote server configured, the app explicitly reports that syncing is unavailable.

For hotspot access, configure `HOST=0.0.0.0` and a nonempty `API_KEY`; enter that key in each browser's Settings. Review local network security before handling real records. This is a local research prototype without production authentication, encrypted storage or a clinical validation claim.

## Developer commands

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Use `npm.cmd run dev` for React/Vite development at http://127.0.0.1:5173 with the Express backend on port 4000. `npm.cmd test` runs integration checks, real inference and domain tests. The sample assets and model files must be present for those tests.

`npm.cmd run setup` reacquires the version-pinned grading model, eight source IDRiD images/masks and the benchmark photograph. `npm.cmd run train:lesions` retrains and calibrates the small lesion baseline. `npm.cmd run audio` regenerates the bundled speech. These scripts are all JavaScript.

See **ATTRIBUTION.md** for sources and licensing. The distributed ZIP excludes npm dependencies, MongoDB binaries, local database contents, uploads and downloaded training photographs. It includes model artifacts and the public benchmark sample.
