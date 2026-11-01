# Complete screening report

Use Image reports > Print / save PDF, then select Save as PDF or a printer. The report includes patient details, screening date, each uploaded eye, predicted grade, five class scores, original image, Grad-CAM, segmentation with supported masks and boxes, category counts, quality, guidance, model version, clinical review, and referral when recorded. Missing maps and retake results are explicitly identified; AI findings are not doctor-confirmed diagnoses.

Printing waits for report images and fonts. A failed image load shows an error instead of opening an incomplete printout. The header-only cover page was removed.

Verification: Vite production build passed. Headless Chrome rendered a synthetic one-eye record using saved benchmark model outputs, verified three image views, five grade rows and successful image decoding, and generated a PDF. A two-eye case including a retake and synthetic doctor notes verified six views and ten score rows without browser errors. Real patient data was not used in these browser checks.
