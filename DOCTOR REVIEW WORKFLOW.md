# Patient → Doctor → Prescription

1. Stop the current project server with Ctrl+C.
2. To create the deployment administrator, run `node scripts/start-admin-setup.mjs` from the project folder. Choose your own administrator email and password. No default credentials are shipped. If the chosen email is already registered, it is not promoted; use a new administrator email. This setup starts the app using the existing database.
3. Log in with the administrator account. Review each doctor's registration independently, then approve the correct doctor in the Doctor verification panel. Approval is a real access grant; do not approve an unverified identity.
4. Patient logs in, selects a case and opens Image reports or Doctor review. Under Send for doctor review, choose the verified doctor. The checkbox shares the selected case. The explicit Share all my existing reports button shares all currently existing cases owned by this patient with that doctor. It does not grant access to future cases or other patients' reports.
5. Doctor logs in. Shared cases appear automatically; the first accessible case is selected. Open Image reports to inspect original images, heatmaps and segmentation. Complete Doctor review; both eye images are required by the existing review workflow.
6. Saving a review opens Prescriptions. The reviewing verified doctor can enter medicine, dosage, frequency, duration, instructions and observations and issue a prescription. Patients cannot issue prescriptions. Only the issuing doctor can discontinue one.
7. The patient sees prescriptions by selecting that case. Notifications persist in MongoDB and appear in the header and Notifications page. Mark as read is saved. Notifications now cover sharing (to the doctor), screening completion, review completion, prescription issue and discontinuation.

The interface refreshes account verification every 20 seconds, case data every 20 seconds, and notifications every 30 seconds. Refresh the page after installing the update. Both accounts must connect to the same running server and MongoDB database.

If a report is still missing, confirm: doctor verified, patient owns the report, patient shared it with that exact doctor account, both browsers use the same server address, and doctor is logged in with the intended email. Existing unowned records are not automatically assigned to a patient; an administrator migration is still needed for those historical records.

No medication reminder scheduler or email delivery was added in this update. Notifications do not replace clinical communication. Browser visual testing remains incomplete; the executed workflow integration test and production build passed.
