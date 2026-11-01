# Complete report export fix

The attached PDF had original photos but both glaucoma outputs remained review_required, so there were no scores or attention maps. In explicitly enabled research test mode, uploads now run binary glaucoma inference after basic image-quality checks without claiming operator or doctor confirmation. Ordinary non-test mode still requires operator confirmation.

Print / save PDF fetches the latest saved case and fills missing experimental glaucoma results for every uploaded eye before opening the print dialog. Versions are passed consecutively, predictions/maps are persisted, then all report images and fonts are awaited. A failed analysis prevents incomplete printing. Quality rejections retain their genuine retake reasons. Ctrl+P uses the same preparation flow.

Complete report: DR + Glaucoma prints the DR and glaucoma reports together, with separate sections and both eyes. Includes patient details, five DR scores, two glaucoma scores per eye, original images, DR Grad-CAM, DR segmentation, glaucoma Grad-CAM, category counts, quality, actual doctor review/notes where present, model details and guidance. No glaucoma disc/cup segmentation is fabricated.

Verified production build, 43 tests, and headless Chrome starting with both eyes pending. Before printing, both actual benchmark glaucoma outputs were saved without falsely marking operator approval. The generated four-page A4 combined PDF contained two disease reports, 10 DR score rows, four glaucoma score rows and ten original/map views. All pages were rendered with Poppler and inspected. Browser patient identity and clinical notes were synthetic test fixtures; no patient data is packaged.
