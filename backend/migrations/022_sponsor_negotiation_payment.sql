-- Migration 018: negotiation step + payment tracking on sponsor_application
--
-- - SA_NegotiationStep: 0..4 — current step on the negotiation flow
--   (0=negotiation, 1=review terms, 2=digital contract, 3=upload contract, 4=done)
-- - SA_PaidAt: timestamp of payment receipt upload (null = unpaid)
-- - SA_ReceiptFile: filename of uploaded payment proof (null = nothing uploaded)

ALTER TABLE `sponsor_application`
  ADD COLUMN `SA_NegotiationStep` TINYINT UNSIGNED NOT NULL DEFAULT 0
    AFTER `SA_Status`,
  ADD COLUMN `SA_PaidAt` TIMESTAMP NULL DEFAULT NULL
    AFTER `SA_AppliedAt`,
  ADD COLUMN `SA_ReceiptFile` VARCHAR(255) NULL DEFAULT NULL
    AFTER `SA_PaidAt`;
