# MERN verification record

Verified 1 November 2026 on Windows with Node.js 26.13.0. Installed versions include React 19.3.1, Express 5.3.0, Mongoose 9.11.4, TensorFlow.js 4.22.0, Sharp 0.34.5 and Vite 7.3.7. package-lock.json records exact resolved dependencies; use npm ci.

Completed:

- `npm run build`: React/Vite production build passed. Its output is included under client/dist.
- `npm test`: 17 tests passed, no failures or skips. Covered multipart both-eye uploads, missing-model abstention, modality gate, flat/corrupt input rejection, metadata limits, malformed JSON, origin rejection, explicit demos, HTML escaping, valid PDF bytes, JSON export, report retrieval/history, bounded memory storage, Mongoose schema validation, metrics, thresholds, patient leakage and duplicate-image checks.
- `npm run test:ml`: actual JavaScript optimizer execution passed on 15 temporary abstract noise fixtures. Checked best-checkpoint save/load, separate held-out evaluation, five scores summing to one, inference/abstention branches and stable tensor counts across repeated inference. These arbitrary fixtures are not medical training data, all temporary weights were removed, and no disease-performance result is claimed.
- Browser inspection confirmed the built React page, two-eye controls, model/storage state, illustrative demo, recent-report entry and report preview. A new MERN interface screenshot is included in this folder. API tests verified generated PDFs; the PDF route uses an ordinary HTTP download instead of a browser print popup.

Limits:

- No real medical dataset or clinical checkpoint was acquired, trained or validated.
- MongoDB server/Docker were unavailable in the test environment. The actual Mongoose schema was validated; live MongoDB connection, writes, restart persistence and Docker Compose were not exercised. HTTP tests used the explicit temporary-memory store. Follow README.md to connect your own MongoDB and verify persistence before integration.
- Browser file-picker automation, mobile viewport, real camera domains, large-scale CPU training, external cohorts and production access controls were not tested.

The ZIP contains no Python code, Python dependencies, patient photographs, trained medical weights, .env credentials or node_modules. It includes source, lockfile, prebuilt React assets and JavaScript tests.
