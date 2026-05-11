import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

if (env.mail.user && env.mail.appPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.mail.user,
      pass: env.mail.appPassword,
    },
  });
}

function renderEmail(title: string, body: string, code: string, expiryMinutes: number) {
  return `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#fafaf9;padding:40px;text-align:center">
      <div style="background:white;padding:32px;border-radius:16px;max-width:480px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
        <h2 style="color:#111;margin:0 0 16px">${title}</h2>
        <p style="color:#666;margin:0 0 24px">${body}</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#e35654;background:#fef2f4;padding:16px;border-radius:12px">${code}</div>
        <p style="color:#999;font-size:12px;margin:24px 0 0">الكود صالح لمدة ${expiryMinutes} دقيقة. إذا لم تطلب هذا الكود، يمكنك تجاهل الرسالة.</p>
      </div>
    </div>
  `;
}

export async function sendOtpEmail(to: string, code: string, expiryMinutes: number): Promise<void> {
  if (!transporter) {
    console.log(`[OTP fallback — Gmail not configured]  to=${to}  code=${code}  ttl=${expiryMinutes}m`);
    return;
  }
  await transporter.sendMail({
    from: `"Mumkin" <${env.mail.user}>`,
    to,
    subject: 'كود التحقق - منصة مُمكّن',
    html: renderEmail('كود التحقق', 'استخدم الكود التالي لإكمال العملية:', code, expiryMinutes),
  });
}

export async function sendPasswordResetEmail(to: string, code: string, expiryMinutes: number): Promise<void> {
  if (!transporter) {
    console.log(`[reset fallback — Gmail not configured]  to=${to}  code=${code}  ttl=${expiryMinutes}m`);
    return;
  }
  await transporter.sendMail({
    from: `"Mumkin" <${env.mail.user}>`,
    to,
    subject: 'إعادة تعيين كلمة المرور - منصة مُمكّن',
    html: renderEmail(
      'إعادة تعيين كلمة المرور',
      'استخدم الكود التالي لإعادة تعيين كلمة المرور:',
      code,
      expiryMinutes
    ),
  });
}

interface CoManagerInviteEmailParams {
  to: string;
  inviteeName: string;
  organizerName: string;
  hackathonTitle: string;
  roleLabel: string;       // "مدير قسم" أو "موظف"
  sectionLabel: string;    // اسم القسم بالعربي
  inviteUrl: string;       // رابط /invite/:token
  expiryDays: number;
}

function renderInviteEmail(p: CoManagerInviteEmailParams): string {
  return `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#fafaf9;padding:40px;text-align:center">
      <div style="background:white;padding:36px;border-radius:16px;max-width:520px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
        <div style="display:inline-block;background:#e35654;color:white;width:56px;height:56px;border-radius:14px;line-height:56px;font-size:28px;margin-bottom:18px">✨</div>
        <h2 style="color:#111;margin:0 0 8px;font-size:22px">دعوة للانضمام كفريق تنظيم</h2>
        <p style="color:#666;margin:0 0 20px;font-size:14px">منصة مُمكّن</p>

        <div style="background:#fef2f4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:right">
          <p style="color:#111;margin:0 0 14px;line-height:1.7">
            مرحباً ${p.inviteeName}،<br/>
            دعاك <strong>${p.organizerName}</strong> للانضمام إلى فريق تنظيم هاكاثون
            <strong>"${p.hackathonTitle}"</strong>.
          </p>
          <table style="width:100%;font-size:14px;color:#333">
            <tr>
              <td style="padding:6px 0;color:#888;width:80px">الدور</td>
              <td style="padding:6px 0"><strong>${p.roleLabel}</strong></td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#888">القسم</td>
              <td style="padding:6px 0"><strong>${p.sectionLabel}</strong></td>
            </tr>
          </table>
        </div>

        <a href="${p.inviteUrl}" style="display:inline-block;background:#e35654;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;box-shadow:0 4px 12px rgba(227,86,84,0.3)">
          فتح صفحة الدعوة
        </a>

        <p style="color:#999;font-size:12px;margin:28px 0 0;line-height:1.7">
          هذه الدعوة صالحة لمدة <strong>${p.expiryDays} أيام</strong>. اضغط الرابط أعلاه لقبولها.
          <br/>
          إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل الرسالة.
        </p>
        <p style="color:#bbb;font-size:11px;margin:18px 0 0;direction:ltr">
          ${p.inviteUrl}
        </p>
      </div>
    </div>
  `;
}

export async function sendCoManagerInviteEmail(params: CoManagerInviteEmailParams): Promise<void> {
  if (!transporter) {
    console.log(
      `[invite fallback — Gmail not configured]  to=${params.to}  url=${params.inviteUrl}  ` +
        `role=${params.roleLabel}  section=${params.sectionLabel}  hackathon="${params.hackathonTitle}"`,
    );
    return;
  }
  await transporter.sendMail({
    from: `"Mumkin" <${env.mail.user}>`,
    to: params.to,
    subject: `دعوة للانضمام كـ ${params.roleLabel} في هاكاثون "${params.hackathonTitle}"`,
    html: renderInviteEmail(params),
  });
}

// ─── Registration decision (accept / reject) ────────────────
interface RegistrationDecisionEmailParams {
  to: string;
  participantName: string;
  hackathonTitle: string;
  organizerName: string;
  workspaceUrl: string;       // رابط مساحة العمل (للمقبولين)
  decision: 'accepted' | 'rejected';
}

function renderAcceptedEmail(p: RegistrationDecisionEmailParams): string {
  return `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#fafaf9;padding:40px;text-align:center">
      <div style="background:white;padding:36px;border-radius:16px;max-width:520px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
        <div style="display:inline-block;background:#10b981;color:white;width:56px;height:56px;border-radius:14px;line-height:56px;font-size:28px;margin-bottom:18px">✓</div>
        <h2 style="color:#111;margin:0 0 8px;font-size:22px">تم قبول طلبك في الهاكاثون</h2>
        <p style="color:#666;margin:0 0 20px;font-size:14px">منصة مُمكّن</p>

        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:right">
          <p style="color:#111;margin:0 0 14px;line-height:1.7">
            مرحباً ${p.participantName}،<br/>
            يسعدنا إخبارك بأنه تم قبول طلبك للمشاركة في هاكاثون
            <strong>"${p.hackathonTitle}"</strong>.
          </p>
          <table style="width:100%;font-size:14px;color:#333">
            <tr>
              <td style="padding:6px 0;color:#888;width:110px">الجهة المنظمة</td>
              <td style="padding:6px 0"><strong>${p.organizerName}</strong></td>
            </tr>
          </table>
        </div>

        <a href="${p.workspaceUrl}" style="display:inline-block;background:#e35654;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;box-shadow:0 4px 12px rgba(227,86,84,0.3)">
          الدخول إلى مساحة العمل
        </a>

        <p style="color:#999;font-size:12px;margin:28px 0 0;line-height:1.7">
          يمكنك الآن متابعة آخر التحديثات والاطلاع على تفاصيل الفعالية،
          والبدء في إعداد مشروعك.
        </p>
        <p style="color:#bbb;font-size:11px;margin:18px 0 0;direction:ltr">
          ${p.workspaceUrl}
        </p>
      </div>
    </div>
  `;
}

function renderRejectedEmail(p: RegistrationDecisionEmailParams): string {
  return `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#fafaf9;padding:40px;text-align:center">
      <div style="background:white;padding:36px;border-radius:16px;max-width:520px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
        <div style="display:inline-block;background:#9ca3af;color:white;width:56px;height:56px;border-radius:14px;line-height:56px;font-size:28px;margin-bottom:18px">✉</div>
        <h2 style="color:#111;margin:0 0 8px;font-size:22px">بخصوص طلبك في الهاكاثون</h2>
        <p style="color:#666;margin:0 0 20px;font-size:14px">منصة مُمكّن</p>

        <div style="background:#fafafa;border-radius:12px;padding:20px;margin-bottom:24px;text-align:right;border:1px solid #f1f1f1">
          <p style="color:#111;margin:0 0 14px;line-height:1.7">
            مرحباً ${p.participantName}،<br/>
            نشكرك على اهتمامك بالمشاركة في هاكاثون
            <strong>"${p.hackathonTitle}"</strong>.
          </p>
          <p style="color:#444;margin:0;line-height:1.7;font-size:14px">
            نأسف لإبلاغك بأنه لم يتم قبول طلبك هذه المرة. نقدّر وقتك ونتمنى لك
            التوفيق في الفعاليات القادمة على منصة مُمكّن.
          </p>
        </div>

        <p style="color:#999;font-size:12px;margin:0 0 0;line-height:1.7">
          شكراً لاهتمامك بمنصة مُمكّن.
        </p>
      </div>
    </div>
  `;
}

export async function sendRegistrationDecisionEmail(
  params: RegistrationDecisionEmailParams,
): Promise<void> {
  if (!transporter) {
    console.log(
      `[decision fallback — Gmail not configured]  to=${params.to}  decision=${params.decision}  ` +
        `hackathon="${params.hackathonTitle}"`,
    );
    return;
  }
  const subject =
    params.decision === 'accepted'
      ? `تم قبول طلبك في هاكاثون "${params.hackathonTitle}"`
      : `بخصوص طلبك في هاكاثون "${params.hackathonTitle}"`;
  const html =
    params.decision === 'accepted'
      ? renderAcceptedEmail(params)
      : renderRejectedEmail(params);

  await transporter.sendMail({
    from: `"Mumkin" <${env.mail.user}>`,
    to: params.to,
    subject,
    html,
  });
}
