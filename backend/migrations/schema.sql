
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applies_hackathon` (
  `PM_ID` int NOT NULL,
  `hackathon_ID` int NOT NULL,
  `idea_title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idea_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `participation_type` enum('solo','team') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'team',
  `team_method` enum('ai','manual') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` datetime DEFAULT NULL,
  `notification_sent_at` datetime DEFAULT NULL,
  `T_ID` int DEFAULT NULL,
  PRIMARY KEY (`PM_ID`,`hackathon_ID`),
  KEY `hackathon_ID` (`hackathon_ID`),
  KEY `idx_apply_team` (`T_ID`),
  CONSTRAINT `applies_hackathon_ibfk_1` FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`),
  CONSTRAINT `applies_hackathon_ibfk_2` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`),
  CONSTRAINT `fk_apply_team` FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate` (
  `C_ID` int NOT NULL AUTO_INCREMENT,
  `M_ID` int NOT NULL,
  `hackathon_ID` int NOT NULL,
  `C_Title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `C_Type` enum('participation','win','completion') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'participation',
  `C_Position` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `C_FileUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `C_IssuedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`C_ID`),
  UNIQUE KEY `uniq_certificate_member_hack_type` (`M_ID`,`hackathon_ID`,`C_Type`),
  KEY `idx_certificate_member` (`M_ID`),
  KEY `fk_certificate_hackathon` (`hackathon_ID`),
  CONSTRAINT `fk_certificate_hackathon` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_certificate_member` FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `digital_contract` (
  `D_ID` int NOT NULL AUTO_INCREMENT,
  `D_content` text COLLATE utf8mb4_unicode_ci,
  `HOM_ID` int DEFAULT NULL,
  `SM_ID` int DEFAULT NULL,
  PRIMARY KEY (`D_ID`),
  KEY `HOM_ID` (`HOM_ID`),
  KEY `SM_ID` (`SM_ID`),
  CONSTRAINT `digital_contract_ibfk_1` FOREIGN KEY (`HOM_ID`) REFERENCES `hackathon_organizer_team` (`HOM_ID`),
  CONSTRAINT `digital_contract_ibfk_2` FOREIGN KEY (`SM_ID`) REFERENCES `sponsor` (`SM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation` (
  `E_ID` int NOT NULL AUTO_INCREMENT,
  `HJ_ID` int NOT NULL,
  `T_ID` int DEFAULT NULL,
  `PM_ID` int DEFAULT NULL,
  `hackathon_ID` int NOT NULL,
  `E_Comment` text COLLATE utf8mb4_unicode_ci,
  `E_EvaluatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`E_ID`),
  UNIQUE KEY `uniq_eval_judge_team` (`HJ_ID`,`T_ID`),
  UNIQUE KEY `uniq_eval_judge_pm` (`HJ_ID`,`PM_ID`),
  KEY `idx_evaluation_team` (`T_ID`),
  KEY `idx_evaluation_hackathon` (`hackathon_ID`),
  KEY `fk_evaluation_pm` (`PM_ID`),
  CONSTRAINT `fk_evaluation_hackathon` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_judge` FOREIGN KEY (`HJ_ID`) REFERENCES `hackathon_judge` (`HJ_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_pm` FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_team` FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`) ON DELETE CASCADE,
  CONSTRAINT `chk_evaluation_target` CHECK ((((`T_ID` is not null) and (`PM_ID` is null)) or ((`T_ID` is null) and (`PM_ID` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_score` (
  `ES_ID` int NOT NULL AUTO_INCREMENT,
  `E_ID` int NOT NULL,
  `ES_CriterionName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ES_Score` tinyint unsigned NOT NULL,
  `ES_SortOrder` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`ES_ID`),
  KEY `idx_evaluation_score_eid` (`E_ID`),
  CONSTRAINT `fk_evaluation_score_eval` FOREIGN KEY (`E_ID`) REFERENCES `evaluation` (`E_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluator` (
  `EM_ID` int NOT NULL,
  `HOM_ID` int DEFAULT NULL,
  PRIMARY KEY (`EM_ID`),
  KEY `HOM_ID` (`HOM_ID`),
  CONSTRAINT `evaluator_ibfk_1` FOREIGN KEY (`EM_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE,
  CONSTRAINT `evaluator_ibfk_2` FOREIGN KEY (`HOM_ID`) REFERENCES `hackathon_organizer_team` (`HOM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon` (
  `hackathon_ID` int NOT NULL AUTO_INCREMENT,
  `H_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_description` text COLLATE utf8mb4_unicode_ci,
  `H_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_city` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_full_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_public_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_contact_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `H_visibility` enum('public','private') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `H_status` enum('draft','published','ongoing','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `H_created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `H_Branding` json DEFAULT NULL,
  `H_JudgingCriteria` text COLLATE utf8mb4_unicode_ci,
  `H_Prize_Terms` text COLLATE utf8mb4_unicode_ci,
  `H_StartDate` datetime DEFAULT NULL,
  `H_EndDate` datetime DEFAULT NULL,
  `H_Hackathon_StartDate` datetime DEFAULT NULL,
  `H_Registration_StartDate` datetime DEFAULT NULL,
  `H_Registration_EndDate` datetime DEFAULT NULL,
  `H_Min_Age` tinyint unsigned DEFAULT NULL,
  `H_Team_Min` tinyint unsigned NOT NULL DEFAULT '1',
  `H_Team_Max` tinyint unsigned NOT NULL DEFAULT '5',
  `H_Target_Participants` int unsigned DEFAULT NULL,
  `H_Participation_Mode` enum('teams_only','individuals_and_teams','individuals_only') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'teams_only',
  `H_Allowed_Countries` enum('all','gulf','saudi_only','arab','custom') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `H_Submission_StartDate` datetime DEFAULT NULL,
  `H_Project_Description` text COLLATE utf8mb4_unicode_ci,
  `H_Project_Requirements` text COLLATE utf8mb4_unicode_ci,
  `H_Submission_Fields` json DEFAULT NULL,
  `H_Max_File_Size_MB` smallint unsigned NOT NULL DEFAULT '50',
  `H_Allow_Late_Submission` tinyint(1) NOT NULL DEFAULT '0',
  `H_Submission_Deadline` datetime DEFAULT NULL,
  `HAM_ID` int DEFAULT NULL,
  `H_Announcement_Date` datetime DEFAULT NULL,
  `H_Winners_Date` datetime DEFAULT NULL,
  `H_Judging_StartDate` datetime DEFAULT NULL,
  `H_Judging_EndDate` datetime DEFAULT NULL,
  PRIMARY KEY (`hackathon_ID`),
  UNIQUE KEY `H_slug` (`H_slug`),
  KEY `HAM_ID` (`HAM_ID`),
  CONSTRAINT `hackathon_ibfk_1` FOREIGN KEY (`HAM_ID`) REFERENCES `hackathon_admin` (`HAM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_admin` (
  `HAM_ID` int NOT NULL,
  PRIMARY KEY (`HAM_ID`),
  CONSTRAINT `hackathon_admin_ibfk_1` FOREIGN KEY (`HAM_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_co_manager` (
  `HCM_ID` int NOT NULL AUTO_INCREMENT,
  `hackathon_ID` int NOT NULL,
  `HCM_FullName` varchar(150) NOT NULL,
  `HCM_Email` varchar(150) NOT NULL,
  `HCM_Role` enum('manager','staff') NOT NULL DEFAULT 'staff',
  `HCM_Section` enum('team','registrations','projects','winners','sponsors','analytics') DEFAULT NULL,
  `HCM_ParentID` int DEFAULT NULL,
  `HCM_Permissions` json DEFAULT NULL,
  `HCM_InviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `HCM_InviteToken` varchar(64) DEFAULT NULL,
  `HCM_InvitedAt` datetime DEFAULT NULL,
  `HCM_InviteExpiresAt` datetime DEFAULT NULL,
  `HCM_AcceptedAt` datetime DEFAULT NULL,
  `M_ID` int DEFAULT NULL,
  PRIMARY KEY (`HCM_ID`),
  UNIQUE KEY `HCM_InviteToken` (`HCM_InviteToken`),
  KEY `hackathon_ID` (`hackathon_ID`),
  KEY `fk_hcm_member` (`M_ID`),
  KEY `fk_hcm_parent` (`HCM_ParentID`),
  CONSTRAINT `fk_hcm_member` FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`) ON DELETE SET NULL,
  CONSTRAINT `fk_hcm_parent` FOREIGN KEY (`HCM_ParentID`) REFERENCES `hackathon_co_manager` (`HCM_ID`) ON DELETE SET NULL,
  CONSTRAINT `hackathon_co_manager_ibfk_1` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_judge` (
  `HJ_ID` int NOT NULL AUTO_INCREMENT,
  `hackathon_ID` int NOT NULL,
  `HJ_FullName` varchar(150) NOT NULL,
  `HJ_Email` varchar(150) NOT NULL,
  `HJ_Specialty` varchar(200) DEFAULT NULL,
  `HJ_InviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `HJ_InviteToken` varchar(64) DEFAULT NULL,
  `HJ_InvitedAt` datetime DEFAULT NULL,
  `HJ_InviteExpiresAt` datetime DEFAULT NULL,
  `HJ_AcceptedAt` datetime DEFAULT NULL,
  `M_ID` int DEFAULT NULL,
  PRIMARY KEY (`HJ_ID`),
  UNIQUE KEY `HJ_InviteToken` (`HJ_InviteToken`),
  KEY `hackathon_ID` (`hackathon_ID`),
  KEY `fk_hj_member` (`M_ID`),
  CONSTRAINT `fk_hj_member` FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`) ON DELETE SET NULL,
  CONSTRAINT `hackathon_judge_ibfk_1` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_organizer_team` (
  `HOM_ID` int NOT NULL AUTO_INCREMENT,
  `team_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HSM_ID` int DEFAULT NULL,
  `hackathon_ID` int DEFAULT NULL,
  PRIMARY KEY (`HOM_ID`),
  KEY `HSM_ID` (`HSM_ID`),
  KEY `hackathon_ID` (`hackathon_ID`),
  CONSTRAINT `hackathon_organizer_team_ibfk_1` FOREIGN KEY (`HSM_ID`) REFERENCES `hackathon_supervisor` (`HSM_ID`),
  CONSTRAINT `hackathon_organizer_team_ibfk_2` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_prize` (
  `HP_ID` int NOT NULL AUTO_INCREMENT,
  `hackathon_ID` int NOT NULL,
  `HP_Position` varchar(100) NOT NULL,
  `HP_Amount` varchar(100) DEFAULT NULL,
  `HP_Description` text,
  `HP_SortOrder` tinyint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`HP_ID`),
  KEY `hackathon_ID` (`hackathon_ID`),
  CONSTRAINT `hackathon_prize_ibfk_1` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_skill` (
  `hackathon_ID` int NOT NULL,
  `skill_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`hackathon_ID`,`skill_name`),
  CONSTRAINT `fk_hackathon_skill_hackathon` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_supervisor` (
  `HSM_ID` int NOT NULL,
  `S_Type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HAM_ID` int DEFAULT NULL,
  PRIMARY KEY (`HSM_ID`),
  KEY `HAM_ID` (`HAM_ID`),
  CONSTRAINT `hackathon_supervisor_ibfk_1` FOREIGN KEY (`HSM_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE,
  CONSTRAINT `hackathon_supervisor_ibfk_2` FOREIGN KEY (`HAM_ID`) REFERENCES `hackathon_admin` (`HAM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hackathon_track` (
  `HT_ID` int NOT NULL AUTO_INCREMENT,
  `hackathon_ID` int NOT NULL,
  `HT_Name` varchar(200) NOT NULL,
  `HT_Description` text,
  PRIMARY KEY (`HT_ID`),
  KEY `hackathon_ID` (`hackathon_ID`),
  CONSTRAINT `hackathon_track_ibfk_1` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `M_ID` int NOT NULL AUTO_INCREMENT,
  `M_Email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `M_Type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `M_FName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `M_LName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `M_password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `M_Bio` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_code_expires_at` timestamp NULL DEFAULT NULL,
  `password_reset_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`M_ID`),
  UNIQUE KEY `unique_email_type` (`M_Email`,`M_Type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `N_ID` int NOT NULL AUTO_INCREMENT,
  `M_ID` int NOT NULL,
  `N_Type` enum('acceptance','team','deadline','evaluation','achievement','system') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `N_Title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `N_Message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `N_Read` tinyint(1) NOT NULL DEFAULT '0',
  `N_ActionLabel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `N_ActionRoute` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `N_CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`N_ID`),
  KEY `idx_notification_member` (`M_ID`),
  KEY `idx_notification_member_read` (`M_ID`,`N_Read`),
  CONSTRAINT `fk_notification_member` FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizer_profile` (
  `OP_ID` int NOT NULL AUTO_INCREMENT,
  `M_ID` int NOT NULL,
  `ORG_Name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`OP_ID`),
  KEY `M_ID` (`M_ID`),
  CONSTRAINT `organizer_profile_ibfk_1` FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participant` (
  `PM_ID` int NOT NULL,
  `T_ID` int DEFAULT NULL,
  `university` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `major` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `study_year` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`PM_ID`),
  KEY `T_ID` (`T_ID`),
  CONSTRAINT `participant_ibfk_1` FOREIGN KEY (`PM_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE,
  CONSTRAINT `participant_ibfk_2` FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participant_skills` (
  `PM_ID` int NOT NULL,
  `P_skills` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`PM_ID`,`P_skills`),
  CONSTRAINT `participant_skills_ibfk_1` FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `S_ID` int NOT NULL AUTO_INCREMENT,
  `hackathon_ID` int NOT NULL,
  `S_Title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `S_Description` text COLLATE utf8mb4_unicode_ci,
  `S_Type` enum('zoom','teams','meet','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'zoom',
  `S_StartAt` datetime NOT NULL,
  `S_DurationMinutes` smallint unsigned NOT NULL DEFAULT '60',
  `S_Link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `S_CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`S_ID`),
  KEY `idx_session_hackathon` (`hackathon_ID`),
  KEY `idx_session_start` (`hackathon_ID`,`S_StartAt`),
  CONSTRAINT `fk_session_hackathon` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsor` (
  `SM_ID` int NOT NULL,
  `S_Brand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `S_CR_Number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`SM_ID`),
  CONSTRAINT `sponsor_ibfk_1` FOREIGN KEY (`SM_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsor_application` (
  `SA_ID` int NOT NULL AUTO_INCREMENT,
  `SM_ID` int NOT NULL,
  `SP_ID` int NOT NULL,
  `SA_Status` enum('pending','accepted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `SA_AppliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SA_ID`),
  UNIQUE KEY `uk_sponsor_package` (`SM_ID`,`SP_ID`),
  KEY `idx_sa_sponsor` (`SM_ID`),
  KEY `idx_sa_package` (`SP_ID`),
  CONSTRAINT `fk_sa_package` FOREIGN KEY (`SP_ID`) REFERENCES `sponsor_package` (`SP_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_sa_sponsor` FOREIGN KEY (`SM_ID`) REFERENCES `sponsor` (`SM_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsor_package` (
  `SP_ID` int NOT NULL AUTO_INCREMENT,
  `hackathon_ID` int NOT NULL,
  `SP_Name` varchar(200) NOT NULL,
  `SP_Type` enum('financial','technical','logistic','hospitality','media','other') NOT NULL DEFAULT 'financial',
  `SP_Description` text,
  `SP_Duration` varchar(100) DEFAULT NULL,
  `SP_Price` decimal(12,2) DEFAULT NULL,
  `SP_Sponsor_Offer` text,
  `SP_Resources` varchar(255) DEFAULT NULL,
  `SP_Benefits` json DEFAULT NULL,
  PRIMARY KEY (`SP_ID`),
  KEY `hackathon_ID` (`hackathon_ID`),
  CONSTRAINT `sponsor_package_ibfk_1` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submission_file` (
  `SF_ID` int NOT NULL AUTO_INCREMENT,
  `TS_ID` int NOT NULL,
  `SF_Name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SF_StoredName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SF_Size` bigint unsigned NOT NULL,
  `SF_MimeType` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SF_UploadedBy` int NOT NULL,
  `SF_UploadedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SF_ID`),
  KEY `idx_submission_file_ts` (`TS_ID`),
  KEY `fk_submission_file_member` (`SF_UploadedBy`),
  CONSTRAINT `fk_submission_file_member` FOREIGN KEY (`SF_UploadedBy`) REFERENCES `member` (`M_ID`) ON DELETE RESTRICT,
  CONSTRAINT `fk_submission_file_ts` FOREIGN KEY (`TS_ID`) REFERENCES `submission` (`TS_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `T_ID` int NOT NULL AUTO_INCREMENT,
  `T_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hackathon_ID` int NOT NULL,
  `T_LeaderId` int NOT NULL,
  PRIMARY KEY (`T_ID`),
  KEY `idx_team_hackathon` (`hackathon_ID`),
  KEY `idx_team_leader` (`T_LeaderId`),
  CONSTRAINT `fk_team_hackathon` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_leader` FOREIGN KEY (`T_LeaderId`) REFERENCES `participant` (`PM_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_message` (
  `TM_ID` int NOT NULL AUTO_INCREMENT,
  `T_ID` int NOT NULL,
  `M_ID` int NOT NULL,
  `TM_Text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `TM_CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TM_ID`),
  KEY `idx_team_message_team_time` (`T_ID`,`TM_CreatedAt`),
  KEY `fk_team_message_member` (`M_ID`),
  CONSTRAINT `fk_team_message_member` FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_message_team` FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submission` (
  `TS_ID` int NOT NULL AUTO_INCREMENT,
  `T_ID` int DEFAULT NULL,
  `PM_ID` int DEFAULT NULL,
  `hackathon_ID` int NOT NULL,
  `TS_ProjectName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TS_ProjectDescription` text COLLATE utf8mb4_unicode_ci,
  `TS_RepoUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TS_DemoUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TS_SubmittedAt` timestamp NULL DEFAULT NULL,
  `TS_CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TS_UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TS_ID`),
  UNIQUE KEY `uniq_team_hackathon` (`T_ID`,`hackathon_ID`),
  UNIQUE KEY `uniq_pm_hackathon` (`PM_ID`,`hackathon_ID`),
  KEY `idx_submission_hack` (`hackathon_ID`),
  CONSTRAINT `fk_submission_hack` FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_pm` FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_team` FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`) ON DELETE CASCADE,
  CONSTRAINT `chk_submission_owner` CHECK ((((`T_ID` is not null) and (`PM_ID` is null)) or ((`T_ID` is null) and (`PM_ID` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

