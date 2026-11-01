# Explicit experimental testing mode

Enabled at the explicit user request for model testing. This is not clinical deployment. The trained candidate failed evaluation; the metrics remain disclosed in the UI. research-testing.json enables an explicit research override. Disable/remove this configuration file and restart to refuse loading a failed candidate.

There is no five-image cap. Training used 252 binary-labeled images, validation used 84 and the held-out test used 84. Five was the number of glaucoma-reference test images missed, not the training-set size.

Choose Glaucoma under Screen a patient and upload to a patient record. Open Image reports, choose the eye, and find Glaucoma screening. A qualified operator must confirm fundus content and optic-disc visibility before clicking Screen saved image for glaucoma. This uses the same saved photo as DR; no second upload is needed. The result is binary research screening, not a severity stage or diagnosis. A genuine glaucoma-model Grad-CAM attention map is provided after rerunning screening. No optic-disc/cup segmentation or cup/disc measurement is provided. Do not use results for diagnosis or treatment.
