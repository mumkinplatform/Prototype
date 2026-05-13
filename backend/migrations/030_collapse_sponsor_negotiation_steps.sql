-- Migration 030: collapse sponsor negotiation steps from 5 (0..4) to 4 (0..3)
--
-- إزالة مرحلة "رفع العقد/الإيصال" — التوقيع على العقد الرقمي يُكمل الرعاية مباشرة.
-- أي تقديم وصل لـ 4 يُحدّث لـ 3، و3 (مرحلة الإيصال القديمة) كذلك يصير 3 (مكتمل).

UPDATE `sponsor_application`
  SET `SA_NegotiationStep` = 3
  WHERE `SA_NegotiationStep` >= 3;
