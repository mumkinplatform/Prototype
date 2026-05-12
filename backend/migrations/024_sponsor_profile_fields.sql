-- Migration 020: sponsor profile fields
--
-- يضيف حقول ملف الراعي الإضافية: المسمى الوظيفي، القطاع، الموقع الإلكتروني، صورة الغلاف.
-- ملاحظة: phone/city/avatar_url موجودة على member في migration 002 (نستخدمها مباشرة).

ALTER TABLE `sponsor`
  ADD COLUMN `S_Position` VARCHAR(100) NULL DEFAULT NULL AFTER `S_CR_Number`,
  ADD COLUMN `S_Industry` VARCHAR(100) NULL DEFAULT NULL AFTER `S_Position`,
  ADD COLUMN `S_Website` VARCHAR(255) NULL DEFAULT NULL AFTER `S_Industry`,
  ADD COLUMN `S_Banner` VARCHAR(255) NULL DEFAULT NULL AFTER `S_Website`;
