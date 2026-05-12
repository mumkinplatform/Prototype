-- ============================================================
-- Migration 025: track when invite emails were actually sent
-- ============================================================
-- الغرض:
--   منع إعادة إرسال إيميلات الدعوة لنفس الشخص لما المنظم يلغي النشر
--   ويعيد النشر. نتعقب وقت آخر إرسال فعلي لكل دعوة (موظف/حكم).
--
--   publishHackathon كان يرسل لكل صف "pending" بدون فحص هل سبق إرسال
--   الإيميل من نشر سابق، فالمستلم يحصل على نفس الإيميل عدة مرات.
-- ============================================================

USE mumkin_db;

ALTER TABLE `hackathon_co_manager`
  ADD COLUMN `HCM_InviteEmailSentAt` DATETIME NULL DEFAULT NULL
    AFTER `HCM_InvitedAt`;

ALTER TABLE `hackathon_judge`
  ADD COLUMN `HJ_InviteEmailSentAt` DATETIME NULL DEFAULT NULL
    AFTER `HJ_InvitedAt`;
