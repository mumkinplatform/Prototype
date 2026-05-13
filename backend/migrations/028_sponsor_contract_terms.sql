-- Migration 028: contract terms + sponsor signature columns
--
-- يكمل فلو التفاوض: المنظم يكتب شروط العقد يدوياً (مدة، قيمة، حقوق
-- الشعار، إلخ)، يرسلها للراعي. الراعي يراجع، يوقّع. المنظم يوقّع. لمن
-- يوقّع الاثنين، العقد يصبح "ساري".
--
-- الأعمدة الجديدة كلها NULLable لأن الطلبات الموجودة (التي وصلت قبل
-- هذه المرحلة) لم تمر بالفورم بعد. SA_OrganizerSigned / At موجودة من
-- migration 023 فلا نكررها هنا.

ALTER TABLE `sponsor_application`
  ADD COLUMN `SA_TermDuration`     VARCHAR(100) NULL AFTER `SA_NegotiationStep`,
  ADD COLUMN `SA_TermValue`        VARCHAR(100) NULL AFTER `SA_TermDuration`,
  ADD COLUMN `SA_TermLogoRights`   TEXT NULL AFTER `SA_TermValue`,
  ADD COLUMN `SA_TermDisplayTime`  VARCHAR(100) NULL AFTER `SA_TermLogoRights`,
  ADD COLUMN `SA_TermDataAccess`   VARCHAR(100) NULL AFTER `SA_TermDisplayTime`,
  ADD COLUMN `SA_TermNotes`        TEXT NULL AFTER `SA_TermDataAccess`,
  ADD COLUMN `SA_TermsSubmittedAt` DATETIME NULL AFTER `SA_TermNotes`,
  ADD COLUMN `SA_SponsorSigned`    TINYINT(1) NOT NULL DEFAULT 0 AFTER `SA_OrganizerSignedAt`,
  ADD COLUMN `SA_SponsorSignedAt`  DATETIME NULL AFTER `SA_SponsorSigned`;
