# Model evaluation and integration

Training completed on 1 November 2026. The existing classifier and pretrained lesion model remain active because the new candidates did not improve validation. No clinically validated replacement was produced.

The API GET /api/health returns models.validation, including training completion, active-weight hash matching, and research status. Evaluation belongs to the exact model hashes in models/evaluation/validation.json. Changed weights invalidate this status.

APTOS audit: 3,662 CSV entries; 569 unreadable or empty files excluded; 3,093 usable images. Grouped train/validation/test sizes: 2,159/469/465. Duplicate and similar-image grouping was applied, but patient identities are unavailable. The existing classifier was already APTOS-trained upstream, so its local evaluation may overlap prior training and is not independent evidence of accuracy. See JSON reports for class-wise metrics and confusion matrices.

New ImageNet-initialized EfficientNet-B0 classifier training and six epochs of later-block fine-tuning failed to improve validation. Segmentation head training also failed to improve validation. Neither candidate was activated. See models/evaluation/grading-training.json and segmentation-training.json.

Segmentation was measured on eight IDRiD images using available expert masks; absent category masks were excluded rather than assumed negative. Upstream training overlap cannot be excluded. These small-sample measurements do not establish clinical reliability.

Start: npm.cmd install, then npm.cmd run dev. Existing MongoDB configuration and model weights are preserved. Restart the running server after installing this update. No new database migration is required.

Clinical deployment requires independent patient-separated external testing, satisfactory per-grade sensitivity, calibration, and appropriate clinical review. Grad-CAM is model attention, not precise lesion segmentation.
