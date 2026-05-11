-- ============================================================
-- Migration 014: application status for applies_hackathon
-- ============================================================
-- الغرض:
--   إضافة حالة قبول/رفض الطلب لتسجيلات المشاركين، عشان المنظم
--   يقدر يراجع كل طلب ويقرر يقبله أو يرفضه قبل ما المشارك يدخل
--   مساحة العمل.
--
-- الحقول الجديدة:
--   - application_status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending'
--     * pending  = الطلب وصل، لسا ما اتراجع
--     * accepted = المنظم قبل الطلب → المشارك يدخل workspace
--     * rejected = المنظم رفض الطلب → المشارك ما يدخل
--
--   - reviewed_at DATETIME NULL
--     * يتعبى لما المنظم يقبل أو يرفض. NULL = لسا pending.
--
-- ملاحظات:
--   * كل الصفوف الموجودة بتاخذ القيمة الافتراضية 'pending' تلقائياً
--     (يعني الطلبات اللي اتسجلت قبل ما نضيف هذا التحديث ستكون pending).
--   * مالنا نحطها NOT NULL على reviewed_at عشان pending ما له تاريخ مراجعة.
-- ============================================================

ALTER TABLE `applies_hackathon`
  ADD COLUMN `application_status`
    ENUM('pending','accepted','rejected')
    NOT NULL
    DEFAULT 'pending'
    AFTER `participation_type`,
  ADD COLUMN `reviewed_at`
    DATETIME NULL
    AFTER `applied_at`;
