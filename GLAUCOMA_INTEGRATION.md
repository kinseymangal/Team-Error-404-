# Glaucoma package inspection and integration

The provided glaucoma-mern-package.zip contains 42 files and no trained model.json, weights.bin or metadata.json checkpoint. Its model card explicitly describes an untrained 128-pixel TensorFlow.js CNN and no measured medical accuracy. Do not treat test fixtures or demo levels as trained medical predictions.

Integrated the original Engine, preprocessing and model loader under server/glaucoma. Existing authentication, case authorization, MongoDB records and DR inference remain in place. GET /api/glaucoma/status requires login. Each new DR upload now also stores a separate glaucoma status and SHA-256 for the exact same image bytes. Reanalysis refreshes both statuses. No second photo is stored.

The Glaucoma page and report panel display unavailable/quality/uncertain/research states. With compatible weights installed, a qualified operator must explicitly confirm fundus content and optic-disc visibility before using POST /api/cases/:id/eyes/:side/glaucoma on a saved image. A doctor review of DR is not glaucoma approval. No glaucoma-specific doctor-assessment workflow, heatmap, segmentation or cup/disc estimator is supplied.

For compatible evaluated research weights, place model.json, weights.bin and metadata.json in models/glaucoma and restart the server. The loader verifies architecture, input dimensions, labels and weight checksum. GLAUCOMA_MODEL_DIR can specify another local directory; GLAUCOMA_THRESHOLD defaults to 0.70, a provisional unvalidated threshold. Compatible format alone does not establish accuracy.

The supplied five-level labels overlap and are not validated clinical severity grades. Before training, use licensed specialist-labeled glaucoma datasets and define an unambiguous endpoint, preferably a validated glaucoma-suspicion screening task with a suitable architecture. Binary labels must not be converted into five invented grades; a binary model requires a matching adapter and independent evaluation. APTOS DR labels do not provide glaucoma supervision.

One retinal photograph can be reused by distinct models only when its field of view and image quality meet each model requirements. A photo cannot establish a glaucoma diagnosis or clinical stage; specialist assessment can include eye pressure, visual fields and OCT. Clinical reference: https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma

## Training completed

A real PAPILA binary candidate has now been trained and evaluated. It failed activation checks and remains disabled. See docs/glaucoma/TRAINING_RESULTS.md and models/evaluation/glaucoma-training.json. The original supplied ZIP still contains no trained weights; this new candidate was developed separately.
