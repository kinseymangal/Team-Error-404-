About Us feature overview: production build passed and isolated desktop/mobile browser checks completed without JavaScript errors or page overflow. Feature rows link to existing screens. Current statuses distinguish research outputs, available functions, appointment requests and partial language coverage. Authentication limiter fix remains included; its regression suite passed all 36 tests.

Authentication limiter correction: all 36 tests passed. Regression checks run 45 session checks and 45 doctor-list requests, then six successful logins; none consume the login limit. Forty failed logins trigger a 429 with retry timing. Active session/doctor-list requests and logout still work while login is limited. Registration has its own limit. Restart the server to clear the old in-memory request count and load the corrected middleware.

Stored FAQ update: production build and all 36 tests passed. Tests verify each of 90 English and Hindi exact questions retrieves the intended entry, authenticated MongoDB seeding/idempotence, 10-item pagination, category filtering, selected-answer retrieval and unknown-ID rejection. Isolated browser check searched the question library and opened the stored password answer without JavaScript errors.

Offline chatbot update: 35 tests passed (0 failures), production build passed. Added help-topic routing, unsupported-question fallback, Hindi help, urgent-symptom guidance, login requirement and message-size validation checks. Isolated browser test submitted a quick question, rendered the response, checked the mobile chat layout and observed no JavaScript errors. No external AI provider is configured or used.

Brand update: production build passed. Reusable SVG eye mark and live-text name/tagline applied to login/signup, sidebar, footer, browser icon and printed report/prescription headers. Isolated browser checks found no page errors or mobile horizontal overflow. Clinical report printing was build-checked but not visually printed in this update.

Language update: production build passed. Isolated browser checks switched between gu/mr/bn, verified translated home headings, no mobile horizontal overflow and Bengali preference persistence after reload. No JavaScript errors observed.

Readability update: production build passed. Isolated browser rendering checked larger text, logo, buttons, About Us and footer on desktop and mobile. Footer About Us navigation worked; checked pages had no JavaScript errors or horizontal overflow. This presentation-only update did not rerun backend tests; prior full suite passed 31 tests.

Visual theme update: production build passed; 31 automated tests passed. Headless Chrome rendered the built login/signup (including doctor fields), home, navigation pages, dark mode and 390px mobile settings using isolated sample API responses. No JavaScript page errors or horizontal overflow were observed in those checked layouts. Confirmed one video on home and zero on other navigation pages/login. Screenshots reviewed for login, home, dark settings and mobile settings. These layout checks used synthetic account responses; the separate automated test suite exercises actual backend/database workflows. Not every populated clinical page was visually verified.

Directory update: full existing suite passed (31 tests); extended authenticated integration test passed for 25 MongoDB seed records, filtering, pagination, nearest sorting, missing-location validation, patient edit denial, admin edit persistence and optimistic concurrency. Production build passed. Browser visual QA remains uncompleted.

# Segmentation update verification
31 automated tests passed, 0 failed, 0 skipped. Vite production build passed.
Executed real inference on IDRiD_07 and IDRiD_55, plus a downsampled version of IDRiD_55. Distinct masks and heatmaps, four lesion channels, persisted rerun API, stale-version rejection and review invalidation checked.
ONNX export versus original PyTorch logits on a deterministic input: maximum absolute error 0.000233, mean 0.0000119.
One low-resolution sample produced an excessive exudate mask; that category is hidden while other localized categories remain available. This is not proof of clinical accuracy. Dataset overlap with pretrained model training is possible; no independent clinical evaluation claimed.
Browser visual QA unavailable because local browser use is disabled. Render/build and backend checks were executed.
