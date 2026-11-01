# Appointment permissions

Administrator login is no longer required to record hospital confirmation. Patient record owners and verified doctors with case authorization can select/change a hospital, request an appointment, record a hospital-provided time/reference, cancel and manage follow-up. Existing doctor review and date checks remain. A confirmation is explicitly recorded as reported_external and audit history stores the logged-in actor ID/role; no live hospital booking is invented.

The care page can load transport groups for logged-in users, filtered to their accessible patient cases. The transport endpoint no longer throws an administrator error while opening appointment care. Global transport changes remain coordinator/admin actions; patients and doctors see the status instead of nonfunctional editing controls. Hospital-directory edits, credential verification and model administration remain separate administrator operations.

Verification: all 44 tests passed, including patient appointment request/confirmation, doctor hospital selection/confirmation, rejection of an unauthorized doctor, and isolation of transport members from unrelated patients. Frontend production build passed.
