# TensorFlow.js baseline model card

Status: untrained architecture supplied; no medical checkpoint, real dataset, measured medical accuracy or clinical validation included.

Architecture: three strided 3x3 ReLU convolutional layers (16, 32, 64 filters), global average pooling, a 32-unit ReLU dense layer and five-way softmax. TensorFlow.js 4.x portable CPU backend. Random Glorot initialization with a recorded seed; no pretrained visual model. Seeded batch shuffling, class-weighted categorical cross-entropy and Adam. Training selects the best validation macro-F1 checkpoint. No test data is used for model selection. It is a small research baseline, not a claim that a small CNN is sufficient for glaucoma staging.

Preprocessing shared by inference/training: Sharp format/decompression checks, EXIF rotation, flatten transparency to black, sRGB conversion, square padding/resize to 128x128, RGB channels scaled to [0,1]. No center crop, automated optic-disc localization, segmentation, or medical measurements. Low resolution may lose diagnostically important detail; compare higher-resolution and validated optic-disc ROI strategies during real study design. This baseline has no augmentation. File and decoded-pixel duplicates and patient overlap between splits are rejected, but near-duplicate detection and cross-source identity reconciliation remain separate work.

Checkpoint format: model.json, weights.bin and metadata.json. Fixed architecture identifier, input size, label order, output shape and weight SHA-256 are validated before use. Model ID hashes model topology and weights. The old edition's PyTorch checkpoints cannot be loaded. Only load model files from trusted sources.

Inference: no stage without compatible weights, basic technical quality checks and an operator confirmation of modality/disc visibility. If the highest score is below the configured threshold, no level is assigned. Softmax scores are not calibrated probabilities. Default threshold 0.70 is an engineering placeholder and must be selected on a validation cohort. A high score does not establish domain validity or a correct prediction. Non-fundus and ungradable inputs need a separately validated detector.

Labels preserve the user's five-level wording. Level 1 overlaps Level 2; specialists must define mutually exclusive reference labels and objective structural criteria before collecting training cases. Functional glaucoma stages should not be silently substituted for structural labels. Clinical assessment may require OCT, fields, IOP and other evidence.

Metrics supplied: point estimates of accuracy, balanced accuracy, macro-F1, per-class recall/precision/F1, confusion matrix, quadratic weighted kappa, mean absolute ordinal error, errors of two or more levels, abstention coverage, accepted-case accuracy and source-level results. Patient-clustered uncertainty, calibration, independent-site tests, intergrader agreement, subgroup assessment and clinical validation remain necessary research work. No level, score or report is a clinical recommendation.

Clinical/data source links are in DATASET_PLAN.md. Technical references: https://www.tensorflow.org/js/guide/train_models and https://js.tensorflow.org/api/latest/ . This app uses JavaScript only; no model conversion from another language is required.
