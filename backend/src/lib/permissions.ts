// ─────────────────────────────────────────────────────────────────────────────
// Co-manager sections and permissions.
//
// This file is the single source of truth for the permission system used by
// hackathon co-managers (managers + staff). The frontend has an identical copy
// at frontend/src/lib/permissions.ts — keep them in sync.
//
// Permission keys are derived from actual UI actions in each management page:
//   • HackathonRegistrations.tsx  → registrations
//   • HackathonProjects.tsx       → projects (includes judge management tab)
//   • HackathonSponsors.tsx       → sponsors
// ─────────────────────────────────────────────────────────────────────────────

export const SECTIONS = [
  'team',
  'registrations',
  'projects',
  'sponsors',
] as const;

export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  team: 'إدارة فرق التنظيم',
  registrations: 'إدارة التسجيلات والمشاركين',
  projects: 'إدارة المشاريع والتحكم',
  sponsors: 'الرعاة والمفاوضات',
};

export interface PermissionDef {
  key: string;
  label: string;
}

export const PERMISSIONS_BY_SECTION: Record<Section, PermissionDef[]> = {
  team: [
    { key: 'view_team', label: 'عرض فريق التنظيم' },
    { key: 'add_manager', label: 'إضافة مدير قسم' },
    { key: 'add_staff', label: 'إضافة موظف' },
    { key: 'edit_permissions', label: 'تعديل الصلاحيات' },
    { key: 'remove_member', label: 'حذف عضو من الفريق' },
    { key: 'resend_invite', label: 'إعادة إرسال الدعوات' },
  ],
  registrations: [
    { key: 'view_applications', label: 'عرض الطلبات' },
    { key: 'view_applicant_details', label: 'عرض تفاصيل المتقدم' },
    { key: 'accept_application', label: 'قبول طلب' },
    { key: 'reject_application', label: 'رفض طلب' },
    { key: 'bulk_accept', label: 'قبول جماعي' },
    { key: 'bulk_reject', label: 'رفض جماعي' },
    { key: 'send_email', label: 'إرسال إيميل للمتقدمين' },
    { key: 'export_list', label: 'تصدير القائمة' },
  ],
  projects: [
    { key: 'view_projects', label: 'عرض المشاريع' },
    { key: 'view_project_details', label: 'عرض تفاصيل المشروع' },
    { key: 'view_evaluations', label: 'عرض تفاصيل التقييم' },
    { key: 'distribute_projects', label: 'توزيع المشاريع على الحكام' },
    { key: 'edit_deadline', label: 'تعديل مهلة التسليم' },
    { key: 'edit_criteria', label: 'تعديل معايير التحكيم' },
    { key: 'edit_settings', label: 'الإعدادات العامة' },
    { key: 'export_projects', label: 'تصدير المشاريع' },
    { key: 'add_judge', label: 'إضافة حكم' },
    { key: 'send_judge_reminder', label: 'تذكير الحكام' },
  ],
  sponsors: [
    { key: 'view_sponsors', label: 'عرض الرعاة' },
    { key: 'view_requests', label: 'عرض طلبات الرعاية' },
    { key: 'start_negotiation', label: 'بدء المفاوضات' },
    { key: 'send_messages', label: 'تراسل مع الرعاة' },
    { key: 'move_to_review', label: 'مراجعة الشروط' },
    { key: 'move_to_contract', label: 'تجهيز العقد' },
    { key: 'sign_contract', label: 'توقيع العقد' },
    { key: 'add_package', label: 'إضافة باقة' },
    { key: 'edit_package', label: 'تعديل باقة' },
  ],
};

// Manager role gets ALL permissions for their section automatically.
export function getAllPermissionsForSection(section: Section): string[] {
  return PERMISSIONS_BY_SECTION[section].map((p) => p.key);
}

// Validate that a permission key belongs to the given section.
export function isValidPermissionForSection(
  section: Section,
  key: string,
): boolean {
  return PERMISSIONS_BY_SECTION[section].some((p) => p.key === key);
}

export function isValidSection(value: unknown): value is Section {
  return typeof value === 'string' && (SECTIONS as readonly string[]).includes(value);
}
