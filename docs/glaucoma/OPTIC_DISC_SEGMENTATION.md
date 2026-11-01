# Actual optic-disc segmentation

A separate pretrained SegFormer is integrated; the binary glaucoma classifier itself does not segment anatomy. Source: pamixsun/segformer_for_optic_disc_cup_segmentation, publisher Xu Sun, Apache-2.0. Exact source revision, ONNX SHA-256 and measured evaluation are in models/optic-disc. Original publisher model card and license are included.

Preprocessing: RGB, square resize to 512 with linear interpolation, scale 1/255, ImageNet RGB normalization. Three model classes: background=0, disc rim=1, cup=2. The full disc mask is classes 1 OR 2, mapped to the native photograph using normalized coordinates. No labels from the DR lesion model are reused. Size sanity checks withhold implausible full-field or tiny outputs.

Executed evaluation: 16 randomly selected PAPILA held-out photographs, seed 2026, each compared with both experts' supplied disc and cup contours. Actual Node/ONNX pipeline mean Dice: disc 0.8239145694, cup 0.5442812006. This is a small research check, not clinical validation or a guarantee on other images. Source publisher reports REFUGE training; upstream data overlap was not independently audited.

Enable experimental DISC masks only. CUP masks are withheld. No cup-to-disc ratio or anatomical severity grade is calculated. Blue overlay and box show predicted disc anatomy, not a glaucoma damage region. Old saved reports need rerunning; print preparation reruns old glaucoma results when the new segmentation status is absent.

The upload page now has exactly one left/right input section; the duplicated single-eye result panel above it was removed. Both diseases share the same saved upload, with separate eye/disease switches on Image reports. New reports include original, glaucoma Grad-CAM and optic-disc segmentation.

Runtime remains Node/Express/ONNX; no Python service or Python installation is needed to run the supplied app. The larger pretrained model is included in the complete archive.
