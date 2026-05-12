// Apply migrations 018, 021, 022, 023, 024 (from the team pull) on the local
// DB. Each step is idempotent — catches "duplicate column" / "table doesn't
// exist" so re-running is safe.
import { pool } from '../src/db/pool';

async function step(name: string, sql: string) {
  try {
    await pool.execute(sql);
    console.log(`✓ ${name}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('Duplicate column') ||
      msg.includes("doesn't exist") ||
      msg.includes('already exists')
    ) {
      console.log(`↺ ${name} — already applied, skipping`);
    } else {
      throw e;
    }
  }
}

async function main() {
  // 018 — drop the session table
  await step('018: drop session table', 'DROP TABLE IF EXISTS `session`');

  // 021 — H_views on hackathon
  await step(
    '021: H_views on hackathon',
    'ALTER TABLE `hackathon` ADD COLUMN `H_views` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `H_status`',
  );

  // 022 — sponsor_application: negotiation + payment
  await step(
    '022a: SA_NegotiationStep',
    'ALTER TABLE `sponsor_application` ADD COLUMN `SA_NegotiationStep` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `SA_Status`',
  );
  await step(
    '022b: SA_PaidAt',
    'ALTER TABLE `sponsor_application` ADD COLUMN `SA_PaidAt` TIMESTAMP NULL DEFAULT NULL AFTER `SA_AppliedAt`',
  );
  await step(
    '022c: SA_ReceiptFile',
    'ALTER TABLE `sponsor_application` ADD COLUMN `SA_ReceiptFile` VARCHAR(255) NULL DEFAULT NULL AFTER `SA_PaidAt`',
  );

  // 023 — organizer signature on sponsor_application
  await step(
    '023a: SA_OrganizerSigned',
    'ALTER TABLE `sponsor_application` ADD COLUMN `SA_OrganizerSigned` TINYINT(1) NOT NULL DEFAULT 0 AFTER `SA_ReceiptFile`',
  );
  await step(
    '023b: SA_OrganizerSignedAt',
    'ALTER TABLE `sponsor_application` ADD COLUMN `SA_OrganizerSignedAt` TIMESTAMP NULL DEFAULT NULL AFTER `SA_OrganizerSigned`',
  );

  // 024 — sponsor profile fields
  await step(
    '024a: S_Position',
    'ALTER TABLE `sponsor` ADD COLUMN `S_Position` VARCHAR(100) NULL DEFAULT NULL AFTER `S_CR_Number`',
  );
  await step(
    '024b: S_Industry',
    'ALTER TABLE `sponsor` ADD COLUMN `S_Industry` VARCHAR(100) NULL DEFAULT NULL AFTER `S_Position`',
  );
  await step(
    '024c: S_Website',
    'ALTER TABLE `sponsor` ADD COLUMN `S_Website` VARCHAR(255) NULL DEFAULT NULL AFTER `S_Industry`',
  );
  await step(
    '024d: S_Banner',
    'ALTER TABLE `sponsor` ADD COLUMN `S_Banner` VARCHAR(255) NULL DEFAULT NULL AFTER `S_Website`',
  );

  console.log('\nAll team migrations applied.');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
