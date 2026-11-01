# MERN integration

This edition is JavaScript throughout. React uses native multipart FormData with fetch. Express validates and decodes uploads with Multer/Sharp. TensorFlow.js performs CPU inference. Mongoose persists reports to MongoDB when configured; PDFKit generates downloadable PDFs. No remote ML endpoint or Python process is involved.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/status | Model availability, label order, threshold and storage mode |
| POST | /api/analyze | Multipart left/right uploads and research report creation |
| POST | /api/demo | Explicit illustrative report from a manually selected level |
| GET | /api/reports | Latest 50 report summaries |
| GET | /api/reports/:id | One report as a JSON envelope |
| GET | /api/reports/:id/pdf | Direct downloadable PDF |
| GET | /api/reports/:id/html | Downloadable escaped HTML |
| GET | /api/reports/:id/json | Downloadable JSON report |

Multipart fields: left and/or right (one file per eye), study_reference (optional, up to 100 characters), confirm_left and confirm_right (string true/false). Omitted confirmation means false. Decoded files must be single-frame JPEG/PNG/WebP, at most 15 MiB and 25 megapixels. Basic checks flag severely dark/light, flat or small images. There is no trained retinal-content or gradability detector.

React integration example:

```js
const form = new FormData();
form.append('left', file);
form.append('study_reference', 'PSEUDONYMOUS-024');
form.append('confirm_left', String(operatorConfirmedModalityAndQuality));
const response = await fetch('/api/analyze', {method: 'POST', body: form});
const payload = await response.json();
if (!response.ok) throw new Error(payload.error);
const report = payload.report;
```

Only confirm modality/quality after a trained operator checks fundus content and optic-disc visibility. Confirmation is not a medical validation. Do not manually set multipart Content-Type: the browser adds its required boundary.

HTTP 201 means a report was created, not that a disease prediction was made. Each eye has status, nullable level/label/scores, technical quality, model ID and image SHA-256. Statuses: not_assessed, recapture, review_required, uncertain, research_prediction. Demo reports use illustrative_demo and demo=true. Scores, when present, are five uncalibrated model outputs. Missing/corrupt weights or a failed quality/confirmation gate never assign a level. A missing/expired report returns 404. Bad input is 400, oversize files 413, cross-origin writes 403 and unexpected failures 500.

## Reuse the backend

Import Engine from server/engine.js, initialize one instance per process and await engine.load(modelDirectory). Use engine.analyze(buffer, 'Left', operatorConfirmed). Engine tensors are disposed after inference. Keep raw uploads in memory unless your institution explicitly authorizes storage. Do not expose model directories as static assets.

createApp({engine, store}) in server/app.js lets you attach the module to an existing Express project or adapt its routers. mongoStore(uri) creates a Mongoose connection and a ResearchReport collection; memoryStore() supplies a bounded temporary store. A configured MongoDB connection failure is fatal. Avoid adding your production URI to source control. Do not use temporary memory mode as durable storage.

## Existing project setup

Serve React and API from the same origin or adapt the supplied origin checks and your own authenticated gateway intentionally. The default Vite proxy handles local development. If mounting the module under a URL prefix, update React API paths, Express router mounts and Vite base together. The default app is local-only and has no accounts, authorization or tenancy. Integrate your existing access controls before sharing it. Reports include study references, hashes and predicted results; choose MongoDB location, access and retention rules accordingly.

MongoDB stores report metadata/results only. Images are not stored in MongoDB or on disk. No EHR connection, longitudinal progression model, automatic diagnosis, cup/disc segmentation or multi-disease classifier is implemented.
