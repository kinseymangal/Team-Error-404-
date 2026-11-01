# Actual PAPILA training and evaluation — 1 November 2026

Trained ImageNet-initialized EfficientNet-B0 binary classification with a regularized supervised head and 12 epochs of later-block fine-tuning. Best checkpoint and operating threshold selected on validation only. Suspect labels excluded from the binary task. Both eyes remained together in patient-separated 60/20/20 splits. Images were the original FundusImages, never expert-overlaid images; no clinical variables or expert contours were used as predictors.

488 images from 244 patients: 333 healthy, 87 glaucoma, 68 suspects. Binary train/validation/test sizes 252/84/84. Test: 67 healthy-reference and 17 glaucoma-reference images. Confusion matrix [[46,21],[5,12]]: 12 glaucoma cases detected, 5 missed, 21 healthy-reference images flagged. Accuracy 69.05%, sensitivity 70.59%, specificity 68.66%, precision 36.36%, macro F1 0.6298, AUROC 0.7849. Patient-cluster bootstrap intervals are in models/evaluation/glaucoma-training.json.

Predeclared research activation check required sensitivity >=80%, specificity >=70%, AUROC >=0.75 and at least 10 samples per class. Candidate FAILED; no active glaucoma weights were installed. The check is not clinical validation. Further larger-cohort training and independent external validation are required. Do not tune on this test set.

The runtime now supports the binary ONNX format and refuses failed-gate candidates. Its medical output remains disabled. The trained candidate is delivered separately for research inspection, not as a working diagnostic model. No glaucoma maps, cup/disc measurements or severity stages were trained.

Reproduce: obtain official PAPILA v2 from Figshare (GPL-3.0+), unzip original fundus JPGs and patient_data_od.xlsx/patient_data_os.xlsx into one local dataset directory. Install Python dependencies from scripts/requirements-glaucoma.txt, then run Node scripts/prepare-glaucoma.mjs DATA CACHE. Run Python scripts/train-glaucoma.py --dataset DATA --cache CACHE --imagenet-weights IMAGENET_EFFICIENTNET_B0_PTH --output CANDIDATE --epochs 12. The initial weights were torchvision ImageNet efficientnet_b0_rwightman-7f5810bc.pth, not glaucoma-trained weights. Run Node scripts/evaluate-glaucoma-api.mjs CANDIDATE DATA to check ONNX/production preprocessing parity.

Dataset authors: Oleksandr Kovalyk, Juan Morales-Sanchez, Rafael Verdu-Monedero, Inmaculada Selles-Navarro, Ana Palazon-Cabanes, Jose Luis Sancho-Gomez. Cite DOI 10.1038/s41597-022-01388-1 and dataset DOI 10.6084/m9.figshare.14798004.v2. No original images or clinical spreadsheets are redistributed with the app.

## Later explicit testing override

The user subsequently requested experimental access despite the failed evaluation. research-testing.json now enables this candidate for testing only, without an image-count limit. The metrics and failed-gate status are unchanged; this is not clinical approval.
