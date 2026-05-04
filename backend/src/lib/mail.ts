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
