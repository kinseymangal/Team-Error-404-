# Real-data acquisition and annotation plan

No patient images, synthetic disease cases, or fabricated stage labels are included. The supplied manifest is deliberately empty. A new medical dataset cannot be made clinically representative by generating pictures. No dataset can honestly guarantee coverage of every possible case.

## Candidate sources (checked 1 November 2026)

| Source | Useful for | Limitation for this project | Authoritative source |
| --- | --- | --- | --- |
| REFUGE | 1,200 color fundus photographs; glaucoma classification and optic-disc/cup annotations | Binary clinical labels do not map to five stages; labels incorporate clinical records | https://refuge.grand-challenge.org/Details/ and https://arxiv.org/abs/1910.03667 |
| AIROGS | Large, multi-site color-fundus glaucoma screening cohort | Screening labels are not five structural stages; challenge restrictions differ from ordinary research use | https://airogs.grand-challenge.org/data-and-challenge/ and https://arxiv.org/abs/2302.01738 |
| PAPILA | Paired-eye fundus images and clinical information, useful for suspect-case research | Not a complete five-stage reference standard; check patient-level identifiers and current distribution terms | https://www.nature.com/articles/s41597-022-01388-1 |
| GAMMA | Fundus photographs paired with OCT for glaucoma grading | Multimodal labels and grading scheme need separate adjudication for this project | https://arxiv.org/abs/2202.06511 |

Obtain data directly from the custodians. Read and record the current license or data-use agreement, permitted purposes, redistribution restrictions, and access conditions before downloading or using it. This ZIP conveys no rights to those datasets. Some sources may require registration or a signed agreement; no agreement was accepted for you. No official five-class download or automatic binary-to-stage conversion is supplied.

Harvard-GDP uses OCT RNFL maps and must not be treated as a color fundus camera training dataset: https://github.com/Harvard-Ophthalmology-AI-Lab/Harvard-GDP.

## Resolve the labels first

The original Level 1 “Normal / suspicious glaucoma” overlaps Level 2 “Glaucoma suspect.” This project preserves the wording, but a glaucoma specialist must approve mutually exclusive definitions before real training. A reasonable *proposal for review* is Level 1 for normal/reference cases and Level 2 for suspicious findings without established structural damage. Do not silently make this change or translate visual-field severity into structural severity.

Levels 3–5 need explicit structural criteria, supporting evidence, grading instructions and adjudication rules. This software deliberately does not invent cup-to-disc cutoffs, RNFL thresholds or diagnostic criteria. If reproducible five-way labels cannot be obtained, use the source dataset's supported screening task in a separately configured model instead of manufacturing severity labels.

## Collect and review

1. Obtain institutionally authorized, de-identified color fundus photographs. Record source, patient linkage across institutions where possible, camera, site, field of view, laterality, capture date grouping and license. Use pseudonymous IDs; keep linkage keys outside this package.
2. Have two distinct qualified graders label independently, blinded to AI output. A senior adjudicator resolves disagreements using a written protocol. Record all three reviewer identifiers, approved level and evidence. The manifest checks metadata presence; it cannot authenticate a grader or the clinical quality of an annotation.
3. Use OCT, visual fields, IOP and clinical examination where needed to establish the reference standard. Input modality for this baseline remains a single color fundus photograph; supporting clinical data do not become hidden model inputs.
4. Include normal variation, genuine suspects, early disease, moderate and advanced damage. Deliberately sample high myopia, tilted discs, disc-size extremes, cataract/media opacity, peripapillary changes, other retinal disease and multiple camera/site populations. These are confounders or subgroups, not additional outputs of this five-class model.
5. Maintain ungradable, non-fundus and out-of-distribution examples in a separate quality/OOD study. Do not force them into Level 1. The supplied technical heuristics and operator confirmation are not a trained OOD detector.
6. Estimate sample size and class balance with a statistician based on desired uncertainty in sensitivity, especially for early and advanced cases. “At least one per class” is a software check, never a medically adequate sample size.

## Split and audit

Use approximately 70/15/15 train/validation/test proportions as a starting plan, adjusting for study design. Assign whole patients, both eyes, repeated visits and near-duplicate captures to one split. Stratify where possible. Reserve at least one independent site/camera cohort for external testing. Never copy images between splits to fill missing classes.

`npm run audit:data -- --manifest data/manifest.csv --data-root data` checks required metadata, allowed paths, exact file and decoded-pixel duplicates, patient split separation, basic image checks and class presence. It does not detect resized, compressed or cropped near-duplicates, authenticate licenses, detect the same patient under different IDs, or verify whether labels are clinically correct. Perform independent near-duplicate and identity audits.

The data/manifest.csv header is the schema. Image paths are relative to --data-root. Allowed splits: train, val, test. Allowed levels: integers 1–5. Laterality: Left or Right. label_status must be adjudicated. grader_1 and grader_2 must be distinct. A license_reference should identify the agreement or approved license in your records.

## Validation before any patient-facing use

Report locked-test confusion matrices, per-class recall/precision, macro-F1, balanced accuracy, ordinal errors, weighted kappa and patient-clustered confidence intervals. Evaluate calibration, abstention coverage and errors by camera/site and demographic groups with adequate counts. The scripts provide point estimates and source-level metrics; confidence intervals, subgroup inference and calibration studies remain study work. Select operating thresholds on validation data only. A default 0.70 softmax threshold is an engineering placeholder, not a clinical operating point.

Clinical reference: NICE recommends multiple clinical assessments for glaucoma evaluation, including visual fields, optic nerve assessment and IOP: https://www.nice.org.uk/guidance/ng81/chapter/recommendations.

