-- Migration 029: separate "sponsor accepted terms" flag from final signature
--
-- نضيف خطوة موافقة الراعي على الشروط — منفصلة عن التوقيع الرقمي. الفلو:
--   1. المنظم يرسل الشروط → SA_TermsSubmittedAt تنحفظ، step=1
--   2. الراعي يراجع. لو وافق: SA_SponsorAcceptedTerms=1 → step=2 (العقد
--      الرقمي ينفتح). لو ما وافق: يكلّم المنظم في الشات والمنظم يعدّل ثم
--      يعيد الإرسال (مسموح طول ما SA_SponsorAcceptedTerms=0).
--   3. بعد الموافقة، يبدأ التوقيع. المنظم يوقّع أولاً، ثم الراعي.
--
-- الفرق بين القبول والتوقيع: القبول إقرار مبدئي بالشروط، أما التوقيع
-- التزام رسمي على العقد. تفصلهم خطوتان حقيقيتان في الواقع.

ALTER TABLE `sponsor_application`
  ADD COLUMN `SA_SponsorAcceptedTerms`   TINYINT(1) NOT NULL DEFAULT 0 AFTER `SA_TermsSubmittedAt`,
  ADD COLUMN `SA_SponsorAcceptedTermsAt` DATETIME NULL AFTER `SA_SponsorAcceptedTerms`;
