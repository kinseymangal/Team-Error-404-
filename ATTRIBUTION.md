# Data, model and audio sources

## Retinal grading

Third-party pretrained model: https://huggingface.co/Shadow0482/iris-onnx

Version pinned to `904babc43d877b17335892969abbb910677ffe84`. The source model card identifies ResNet50-APTOS-DR, five grades and ImageNet normalization, and declares MIT licensing. Its model card is retained in `models/GRADER_SOURCE.md`. Original source-model linkage: https://huggingface.co/sakshamkr1/ResNet50-APTOS-DR.

`models/provenance.json` records the original ONNX SHA-256 and preprocessing. `models/grader.onnx` is modified to expose internal activations for Grad-CAM and frozen embeddings for candidate training. The preparation script is included. RGB resize uses Sharp cubic interpolation, which is not a verified bit-for-bit match to the model card's PIL pipeline. No independent clinical accuracy evaluation was performed here. Upstream dataset restrictions and provenance remain relevant; do not infer clinical or commercial approval from a model-card license.

APTOS official dataset and competition terms: https://www.kaggle.com/c/aptos2019-blindness-detection/data. The full APTOS image dataset is not included in this ZIP. Grading weights were obtained pretrained, not trained from scratch here.

## IDRiD photographs and lesion annotations

Prasanna Porwal, Samiksha Pachade, Ravi Kamble, Manesh Kokare, Girish Deshmukh, Vivek Sahasrabuddhe and Fabrice Meriaudeau. Indian Diabetic Retinopathy Image Dataset (IDRiD), IEEE DataPort, 2018. DOI: https://doi.org/10.21227/H25W98.

Data descriptor: Porwal et al., Indian Diabetic Retinopathy Image Dataset (IDRiD): A Database for Diabetic Retinopathy Screening Research, Data 2018, 3(3), 25. https://doi.org/10.3390/data3030025.

Original source/license page: https://idrid.grand-challenge.org/Data/ — Creative Commons Attribution 4.0 International: https://creativecommons.org/licenses/by/4.0/.

The setup script acquires files from this version-pinned research mirror: https://huggingface.co/raiyanz/diabetic-retinopathy-analysis/tree/d2b16fd3f9177e102ebf8af9d3d1aa4f9eef252a. Credit belongs to the original IDRiD authors. Training uses images 01–06 with their MA, HE and EX masks; images 07–08 are used for development validation. The ZIP excludes these downloaded training files. Tiny U-Net weights trained from them are included, with the training recipe and measured limitations.

The included demonstration photograph derives from `IDRiD_55.jpg`, resized to width 1200 and re-encoded as JPEG. `blurred.jpg` is an artificially blurred derivative. Both use CC BY 4.0 attribution above. This is one benchmark photograph, not a real left/right eye pair. No ground-truth masks are presented as predictions.

## Audio

Hindi and English WAV files were synthesized from the included draft scripts using eSpeak NG via `@spelling-creator/spellophone` 0.2.1. Source: https://github.com/Spelling-Creator/spellophone. The build-time package is GPL-3.0-or-later; refer to that package for its source/license. The app serves generated WAV audio and does not bundle the speech engine into the client. Scripts need clinician and native-speaker review before field use.

## Application dependencies

React, Express, Mongoose, Vite, ONNX Runtime, TensorFlow.js, Sharp, Lucide, Zod, Multer, yauzl and the MongoDB launcher retain their own licenses. The source ZIP does not bundle node_modules or MongoDB executables; `npm ci` installs pinned dependencies from package-lock.json. This prototype makes no independent claim of clinical validation, regulatory clearance or production readiness.
