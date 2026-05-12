-- Migration 019: organizer signature on sponsor_application
--
-- العقد يصير "ساري" بمجرد ما يخلّص الراعي خطواته (step=4).
-- العمود محفوظ في DB استعداداً لربط جانب المنظم لاحقاً.

ALTER TABLE `sponsor_application`
  ADD COLUMN `SA_OrganizerSigned` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `SA_ReceiptFile`,
  ADD COLUMN `SA_OrganizerSignedAt` TIMESTAMP NULL DEFAULT NULL
    AFTER `SA_OrganizerSigned`;
