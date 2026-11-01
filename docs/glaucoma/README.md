# Clarity — MERN glaucoma research module

Updated JavaScript-only edition: **MongoDB + Express + React + Node.js**, with **TensorFlow.js** training and inference. There is no Python application, Python service, Python model conversion step, or Python dependency in this package.

The interface follows the supplied pale blue-and-white reference: separate left/right fundus uploads, five research levels, report preview and direct PDF/HTML/JSON downloads. MongoDB stores report metadata and results; uploaded photographs are processed in memory and are not saved. A recent-report history is included.

**No clinically trained glaucoma weights or patient dataset are included.** Until you train and install reviewed weights, uploads produce a technical image-check report with no disease level assigned. The separate demo uses a manually selected illustrative level with no image inference or model scores. No generated images are presented as clinical evidence.

## Quick start

Install Node.js 22.12+ (a current supported LTS version is recommended). From this extracted folder:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:8000**. A prebuilt React bundle is also included under client/dist, so npm start works after npm ci even before rebuilding. The build command verifies/rebuilds the source. Stop with Ctrl+C.

Without MONGO_URI, the app explicitly uses temporary in-memory report history (maximum 200 reports, latest 50 listed), cleared on server restart. This lets you try uploads and report generation immediately. For the full persistent MERN setup, connect MongoDB below. The UI always displays which storage mode is active.

## Connect MongoDB

Copy .env.example to .env. PowerShell: `Copy-Item .env.example .env`; macOS/Linux: `cp .env.example .env`. Set:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/clarity_glaucoma
PORT=8000
HOST=127.0.0.1
MODEL_DIR=artifacts/model
MODEL_THRESHOLD=0.70
```

Use a running local MongoDB instance, or your own authorized MongoDB Atlas URI. Keep credentials in .env; it is ignored by Git. If Docker is available, the supplied compose file starts local MongoDB:

```sh
docker compose up -d mongo
npm start
```

The MongoDB port binds only to 127.0.0.1. Data lives in a named Docker volume. Do not delete that volume if you want to retain reports. When MONGO_URI is set, connection errors stop startup; the app never silently substitutes memory storage. Restart after changing environment variables.

## React development

```sh
npm run dev
```

React/Vite runs on http://127.0.0.1:5173 and proxies /api to Express on port 8000. The development proxy is configured for the default API port; update client/vite.config.js if you change it. Production-style local use serves the built React app from Express on one origin. No hosting or deployment is performed by this package.

## Train in JavaScript

First read docs/DATASET_PLAN.md. Obtain licensed real color fundus photographs and specialist-adjudicated stage labels. Your Level 1 wording overlaps Level 2 and needs a mutually exclusive grading protocol before training. Place images under data/images/ and fill data/manifest.csv. Both eyes and repeated visits from each patient must stay in one split. Do not invent cases or copy binary screening labels into severity stages.

```sh
npm run audit:data -- --manifest data/manifest.csv --data-root data
npm run train -- --manifest data/manifest.csv --data-root data --epochs 30 --batch-size 8
npm run evaluate -- --manifest data/manifest.csv --data-root data --model artifacts/model
npm start
```

The JavaScript baseline is a small randomly initialized convolutional network, trained with class-weighted cross-entropy and Adam on TensorFlow.js's portable CPU backend. It does not download ImageNet weights or a pretrained glaucoma model. This baseline replaces the previous edition's ResNet/PyTorch implementation; weight formats are not interchangeable. CPU training can be slow on large real datasets. No native TensorFlow runtime or GPU setup is required. This is a reproducible research starting point, not a claim of a high-performing medical model.

Training writes artifacts/model/model.json, weights.bin, metadata.json and training-history.json. The best epoch is selected using validation macro-F1. Separate evaluation writes artifacts/test-metrics.json. Both file hashes and decoded-image fingerprints are checked for dataset integrity. Evaluate an untouched locked test split, then independently validate external cameras/sites and clinical subgroups. The default 0.70 score threshold is provisional, not a clinically selected operating point. Restart the app after installing new weights.

## Requested five levels

1. Normal / suspicious glaucoma
2. Glaucoma suspect
3. Early structural glaucoma
4. Moderate structural damage
5. Advanced structural damage

They are project-specific structural labels. The app does not infer other diseases, cup-to-disc measurements, OCT findings, visual-field loss or progression. A fundus photograph alone does not establish a clinical glaucoma stage.

## Tests

```sh
npm test
npm run test:ml
```

The first command tests API uploads, report exports, input checks, report storage/schema and dataset auditing. The second tests JavaScript optimizer execution, checkpoint saving/loading, evaluation, inference and abstention using temporary abstract noise fixtures. These fixtures and their arbitrary test labels are **software tests only**, not a glaucoma dataset, and no fixture model is packaged. See docs/VERIFICATION.md for actual results and limits.

## Files

- client/: React UI, Vite configuration and prebuilt dist/.
- server/: Express API, Mongoose report schema/store, Sharp image checks, inference and PDFKit reports.
- ml/: TensorFlow.js model, dataset audit, training, evaluation and software smoke test.
- shared/: label order and preprocessing constants shared by client/server/training.
- data/manifest.csv: empty real-data annotation schema.
- docs/: data sources, model limitations, API integration, verification and UI preview.

All processing is local in the supplied default configuration. Setting an Atlas URI sends report metadata/results to that MongoDB service; photographs are not stored. Reports may still contain sensitive study information: use pseudonymous IDs. This local research starter has no authentication or per-user isolation. Before adding it to a shared existing project, integrate your authentication, authorization, TLS, retention rules and approved clinical workflow. See docs/INTEGRATION.md.
