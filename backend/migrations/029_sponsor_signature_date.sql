-- Migration 029: sponsor's signature timestamp on the digital contract
--
-- يحفظ تاريخ توقيع الراعي على العقد الرقمي لما يوافق وينتقل
-- من مرحلة "العقد الرقمي" (step 2) إلى "رفع العقد" (step 3).
-- يظهر للطرفين كتوقيع رسمي على العقد.

ALTER TABLE `sponsor_application`
  ADD COLUMN `SA_SponsorSignedAt` TIMESTAMP NULL DEFAULT NULL
    AFTER `SA_OrganizerSignedAt`;
