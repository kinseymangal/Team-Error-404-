---
license: apache-2.0
tags:
- image-segmentation
- vision
- fundus
- optic disc
- optic cup
widget:
- src: >-
    https://huggingface.co/pamixsun/swinv2_tiny_for_glaucoma_classification/resolve/main/example.jpg
  example_title: fundus image
---
# Model Card for Model ID

<!-- Provide a quick summary of what the model is/does. -->

This SegFormer model has undergone specialized fine-tuning on the [REFUGE challenge dataset](https://refuge.grand-challenge.org/), 
a public benchmark for semantic segmentation of anatomical structures in retinal fundus images. 
The fine-tuning enables expert-level segmentation of the optic disc and optic cup, two critical structures for ophthalmological diagnosis.


## Model Details

### Model Description

<!-- Provide a longer summary of what this model is. -->

- **Developed by:** [Xu Sun](https://pamixsun.github.io)
- **Shared by:** [Xu Sun](https://pamixsun.github.io)
- **Model type:** Image segmentation
- **License:** Apache-2.0

## Uses

<!-- Address questions around how the model is intended to be used, including the foreseeable users of the model and those affected by the model. -->

This pretrained model enables semantic segmentation of key anatomical structures, namely, the optic disc and optic cup, in retinal fundus images. 
It takes fundus images as input and outputs the segmentation results.

## Bias, Risks, and Limitations

<!-- This section is meant to convey both technical and sociotechnical limitations. -->

The model has undergone specialized training and fine-tuning exclusively using retinal fundus images, 
with the objective to perform semantic segmentation of anatomical structures including the optic disc and optic cup. 
Therefore, in order to derive optimal segmentation performance, it is imperative to ensure that only fundus images are entered as inputs to this model.

## How to Get Started with the Model

Use the code below to get started with the model.

```python
import cv2
import torch
import numpy as np

from torch import nn
from transformers import AutoImageProcessor, SegformerForSemanticSegmentation

image = cv2.imread('./example.jpg')
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

processor = AutoImageProcessor.from_pretrained("pamixsun/segformer_for_optic_disc_cup_segmentation")
model = SegformerForSemanticSegmentation.from_pretrained("pamixsun/segformer_for_optic_disc_cup_segmentation")

inputs = processor(image, return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits.cpu()

upsampled_logits = nn.functional.interpolate(
    logits,
    size=image.shape[:2],
    mode="bilinear",
    align_corners=False,
)

pred_disc_cup = upsampled_logits.argmax(dim=1)[0].numpy().astype(np.uint8)

```

## Citation [optional]

<!-- If there is a paper or blog post introducing the model, the APA and Bibtex information for that should go in this section. -->

**BibTeX:**

[More Information Needed]

**APA:**

[More Information Needed]


## Model Card Contact

- pamixsun@gmail.com