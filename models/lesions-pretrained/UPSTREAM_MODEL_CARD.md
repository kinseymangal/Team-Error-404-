---
language: en
license: mit
datasets:
- DDR
- FGADR
- IDRID
- MESSIDOR
- RETLES
library: torchSeg
model-index:
- name: unet_seresnext50_32x4d
  results:
  - task:
      type: image-segmentation
    dataset:
      name: IDRID
      type: IDRID
    metrics:
    - type: roc_auc
      value: 0.6701094508171082
      name: AUC Precision Recall - IDRID COTTON_WOOL_SPOT - COTTON_WOOL_SPOT
    - type: roc_auc
      value: 0.7860875129699707
      name: AUC Precision Recall - IDRID EXUDATES - EXUDATES
    - type: roc_auc
      value: 0.6743975877761841
      name: AUC Precision Recall - IDRID HEMORRHAGES - HEMORRHAGES
    - type: roc_auc
      value: 0.39846163988113403
      name: AUC Precision Recall - IDRID MICROANEURYSMS - MICROANEURYSMS
  - task:
      type: image-segmentation
    dataset:
      name: FGADR
      type: FGADR
    metrics:
    - type: roc_auc
      value: 0.4449217915534973
      name: AUC Precision Recall - FGADR COTTON_WOOL_SPOT - COTTON_WOOL_SPOT
    - type: roc_auc
      value: 0.6951484084129333
      name: AUC Precision Recall - FGADR EXUDATES - EXUDATES
    - type: roc_auc
      value: 0.6508341431617737
      name: AUC Precision Recall - FGADR HEMORRHAGES - HEMORRHAGES
    - type: roc_auc
      value: 0.2895563244819641
      name: AUC Precision Recall - FGADR MICROANEURYSMS - MICROANEURYSMS
  - task:
      type: image-segmentation
    dataset:
      name: MESSIDOR
      type: MESSIDOR
    metrics:
    - type: roc_auc
      value: 0.3307325839996338
      name: AUC Precision Recall - MESSIDOR COTTON_WOOL_SPOT - COTTON_WOOL_SPOT
    - type: roc_auc
      value: 0.7123324871063232
      name: AUC Precision Recall - MESSIDOR EXUDATES - EXUDATES
    - type: roc_auc
      value: 0.3926454186439514
      name: AUC Precision Recall - MESSIDOR HEMORRHAGES - HEMORRHAGES
    - type: roc_auc
      value: 0.4098129868507385
      name: AUC Precision Recall - MESSIDOR MICROANEURYSMS - MICROANEURYSMS
  - task:
      type: image-segmentation
    dataset:
      name: DDR
      type: DDR
    metrics:
    - type: roc_auc
      value: 0.5084977746009827
      name: AUC Precision Recall - DDR COTTON_WOOL_SPOT - COTTON_WOOL_SPOT
    - type: roc_auc
      value: 0.6117375493049622
      name: AUC Precision Recall - DDR EXUDATES - EXUDATES
    - type: roc_auc
      value: 0.5447860956192017
      name: AUC Precision Recall - DDR HEMORRHAGES - HEMORRHAGES
    - type: roc_auc
      value: 0.23405438661575317
      name: AUC Precision Recall - DDR MICROANEURYSMS - MICROANEURYSMS
  - task:
      type: image-segmentation
    dataset:
      name: RETLES
      type: RETLES
    metrics:
    - type: roc_auc
      value: 0.5254419445991516
      name: AUC Precision Recall - RETLES COTTON_WOOL_SPOT - COTTON_WOOL_SPOT
    - type: roc_auc
      value: 0.7039055824279785
      name: AUC Precision Recall - RETLES EXUDATES - EXUDATES
    - type: roc_auc
      value: 0.5196094512939453
      name: AUC Precision Recall - RETLES HEMORRHAGES - HEMORRHAGES
    - type: roc_auc
      value: 0.4127877354621887
      name: AUC Precision Recall - RETLES MICROANEURYSMS - MICROANEURYSMS
---
# Lesions Segmentation in Fundus

## Introduction 
We focus on the semantic segmentations of:

1. Cotton Wool Spot
2. Exudates
3. Hemmorrhages
4. Microaneurysms

For an easier use of the models, we refer to cleaned-up version of the code provided in the [fundus lesions toolkit](https://github.com/ClementPla/fundus-lesions-toolkit/tree/main/).

## Architecture

The model uses unet_seresnext50_32x4d as architecture. The implementation is taken from [torchSeg](https://github.com/isaaccorley/torchseg)

## Training datasets

The model was trained on the following datasets:
DDR, FGADR, IDRID, MESSIDOR, RETLES

## Resolution

The image resolution for training was set to 1024 x 1024.
