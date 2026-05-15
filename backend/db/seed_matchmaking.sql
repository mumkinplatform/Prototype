USE mumkin_db;

START TRANSACTION;

INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_organizer@test.local', 'ORGANIZER', 'منظّم', 'تجريبي',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'حساب منظّم تجريبي', 1);
SET @org_id = LAST_INSERT_ID();

INSERT INTO organizer_profile (M_ID, ORG_Name) VALUES (@org_id, 'منظمة تجريبية');
INSERT INTO hackathon_admin (HAM_ID) VALUES (@org_id);


INSERT INTO hackathon (H_title, H_slug, H_description, H_status, H_visibility, HAM_ID, H_Team_Min, H_Team_Max)
VALUES ('هاكاثون تجريبي للاختبار', 'seed-test-hackathon',
        'هاكاثون تجريبي لاختبار خوارزمية المطابقة الذكية', 'published', 'public', @org_id, 2, 5);
SET @hack_id = LAST_INSERT_ID();

-- 3) أربعة مشاركين تجريبيين بمهارات متنوعة
-- مشارك 1: Frontend + UI/UX
INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_p1@test.local', 'PARTICIPANT', 'سلمى', 'العتيبي',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'مصممة واجهات', 1);
SET @p1 = LAST_INSERT_ID();
INSERT INTO participant (PM_ID, T_ID) VALUES (@p1, NULL);
INSERT INTO participant_skills (PM_ID, P_skills) VALUES (@p1, 'Frontend'), (@p1, 'UI/UX');
INSERT INTO applies_hackathon (PM_ID, hackathon_ID) VALUES (@p1, @hack_id);

-- مشارك 2: Backend + AI/ML
INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_p2@test.local', 'PARTICIPANT', 'أحمد', 'المطيري',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'مطوّر ذكاء اصطناعي', 1);
SET @p2 = LAST_INSERT_ID();
INSERT INTO participant (PM_ID, T_ID) VALUES (@p2, NULL);
INSERT INTO participant_skills (PM_ID, P_skills) VALUES (@p2, 'Backend'), (@p2, 'AI/ML');
INSERT INTO applies_hackathon (PM_ID, hackathon_ID) VALUES (@p2, @hack_id);

-- مشارك 3: Mobile + DevOps
INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_p3@test.local', 'PARTICIPANT', 'نورة', 'الشمري',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'مطورة تطبيقات جوال', 1);
SET @p3 = LAST_INSERT_ID();
INSERT INTO participant (PM_ID, T_ID) VALUES (@p3, NULL);
INSERT INTO participant_skills (PM_ID, P_skills) VALUES (@p3, 'Mobile'), (@p3, 'DevOps');
INSERT INTO applies_hackathon (PM_ID, hackathon_ID) VALUES (@p3, @hack_id);

-- مشارك 4: Data Science + Backend
INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_p4@test.local', 'PARTICIPANT', 'خالد', 'الدوسري',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'محلل بيانات', 1);
SET @p4 = LAST_INSERT_ID();
INSERT INTO participant (PM_ID, T_ID) VALUES (@p4, NULL);
INSERT INTO participant_skills (PM_ID, P_skills) VALUES (@p4, 'Data Science'), (@p4, 'Backend');
INSERT INTO applies_hackathon (PM_ID, hackathon_ID) VALUES (@p4, @hack_id);

-- مشارك 5: Blockchain + Frontend
INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_p5@test.local', 'PARTICIPANT', 'منى', 'الحربي',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'مطورة بلوكشين', 1);
SET @p5 = LAST_INSERT_ID();
INSERT INTO participant (PM_ID, T_ID) VALUES (@p5, NULL);
INSERT INTO participant_skills (PM_ID, P_skills) VALUES (@p5, 'Blockchain'), (@p5, 'Frontend');
INSERT INTO applies_hackathon (PM_ID, hackathon_ID) VALUES (@p5, @hack_id);

-- مشارك 6: AI/ML + Data Science
INSERT INTO member (M_Email, M_Type, M_FName, M_LName, M_password, M_Bio, is_verified)
VALUES ('seed_p6@test.local', 'PARTICIPANT', 'فيصل', 'العمري',
        '$2b$10$placeholderhashplaceholderhashplaceholderhashplaceholder', 'باحث ذكاء اصطناعي', 1);
SET @p6 = LAST_INSERT_ID();
INSERT INTO participant (PM_ID, T_ID) VALUES (@p6, NULL);
INSERT INTO participant_skills (PM_ID, P_skills) VALUES (@p6, 'AI/ML'), (@p6, 'Data Science');
INSERT INTO applies_hackathon (PM_ID, hackathon_ID) VALUES (@p6, @hack_id);

COMMIT;

SELECT 'Seed data inserted. Hackathon ID:' AS info, @hack_id AS hackathon_id;
