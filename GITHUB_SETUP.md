# Repository setup

This repository contains the existing Netriv/NayanSetu MERN application. Source, active model weights, frontend assets and tests are included. Patient uploads, MongoDB data, passwords, private environment files, local backups and rejected candidate training files are excluded.

## Clone and run

Install Git LFS, Node.js 22.12+ and npm. Clone this repository, run `git lfs install` and `git lfs pull` to retrieve the active models and homepage video. Run `npm ci`, then `npm run dev`. The application serves the UI and API together on http://127.0.0.1:5173. Windows PowerShell can use `npm.cmd` instead of `npm`.

For shared deployment, configure a persistent MongoDB URI and persistent secure upload storage. Copy `.env.example` to `.env` locally and supply secrets through deployment environment settings. Never commit `.env`. Production frontend build: `npm run build`; backend: `npm start` (or configure PORT/HOST for the host). Do not run `npm run setup` to overwrite existing bundled models: the legacy setup command is for original model bootstrapping.

## Models

DR grading, DR lesion segmentation, experimental glaucoma classification and optic-disc segmentation are included via Git LFS. Model limitations and license/provenance files are retained under models/ and docs/. The glaucoma classifier failed its held-out engineering checks and is explicitly enabled for research testing only. Cup segmentation is withheld. None of these models is clinically validated.

## AMD

AMD remains unavailable in this stable snapshot. The later supplied amd-research-api.zip contains no trained weights; its integration is unfinished and was not copied over the working deployed-source snapshot. Do not claim AMD inference is ready.

## Tests

`npm test` runs software/inference tests using temporary synthetic records and public benchmark images. Git LFS model downloads are required first. MongoDB test runtime may be downloaded on first use. `npm run build` checks the frontend. Software tests are not clinical validation.

## Demo accounts

No passwords or generated user database is included. The administrator can create fictional demo-doctor accounts from Doctor verification. They can access only shared demo patient records. Real doctors still require credential verification and explicit patient authorization.
