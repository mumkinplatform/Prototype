-- Migration 028: file attachments + system messages in sponsor chat
--
-- أضيف أعمدة للمرفقات (اسم/مسار/حجم/نوع) + علم للرسائل التلقائية
-- اللي يولّدها النظام (مثل "تم رفع العقد، يمكنك رفع الإيصال الآن").
-- SAM_Text يصير nullable عشان رسائل الملفات بدون نص.

ALTER TABLE `sponsor_application_message`
  ADD COLUMN `SAM_FileName` VARCHAR(255) NULL AFTER `SAM_Text`,
  ADD COLUMN `SAM_FileUrl` VARCHAR(500) NULL AFTER `SAM_FileName`,
  ADD COLUMN `SAM_FileSize` INT NULL AFTER `SAM_FileUrl`,
  ADD COLUMN `SAM_MimeType` VARCHAR(100) NULL AFTER `SAM_FileSize`,
  ADD COLUMN `SAM_IsSystem` TINYINT(1) NOT NULL DEFAULT 0 AFTER `SAM_MimeType`,
  MODIFY COLUMN `SAM_Text` TEXT NULL;
