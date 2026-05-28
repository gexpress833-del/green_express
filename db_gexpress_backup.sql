-- MySQL dump 10.13  Distrib 8.2.0, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_gexpress
-- ------------------------------------------------------
-- Server version	8.2.0

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

--
-- Table structure for table `agent_approvals`
--

DROP TABLE IF EXISTS `agent_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_approvals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company_id` bigint unsigned NOT NULL,
  `agent_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agent_position` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agent_approvals_agent_email_unique` (`agent_email`),
  KEY `agent_approvals_approved_by_foreign` (`approved_by`),
  KEY `agent_approvals_status_index` (`status`),
  KEY `agent_approvals_company_id_index` (`company_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_approvals`
--

LOCK TABLES `agent_approvals` WRITE;
/*!40000 ALTER TABLE `agent_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `agent_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `siret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `institution_type` enum('etat','hopital','ecole','universite','privee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_count` int NOT NULL,
  `pending_employees` json DEFAULT NULL,
  `status` enum('pending','active','suspended','ended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `contact_user_id` bigint unsigned DEFAULT NULL,
  `monthly_budget` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_slug_unique` (`slug`),
  UNIQUE KEY `companies_siret_unique` (`siret`),
  KEY `companies_contact_user_id_foreign` (`contact_user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_employees`
--

DROP TABLE IF EXISTS `company_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_employees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company_id` bigint unsigned NOT NULL,
  `full_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `function` enum('directeur','manager','employ','stagiaire','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `matricule` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` enum('pending','active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `current_subscription_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_employees_company_id_matricule_unique` (`company_id`,`matricule`),
  UNIQUE KEY `company_employees_email_unique` (`email`),
  KEY `company_employees_current_subscription_id_foreign` (`current_subscription_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_employees`
--

LOCK TABLES `company_employees` WRITE;
/*!40000 ALTER TABLE `company_employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_menus`
--

DROP TABLE IF EXISTS `company_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_menus` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pricing_tier_id` bigint unsigned NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `meal_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_menus_pricing_tier_id_foreign` (`pricing_tier_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_menus`
--

LOCK TABLES `company_menus` WRITE;
/*!40000 ALTER TABLE `company_menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_subscriptions`
--

DROP TABLE IF EXISTS `company_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company_id` bigint unsigned NOT NULL,
  `pricing_tier_id` bigint unsigned NOT NULL,
  `price_per_agent` decimal(10,2) NOT NULL,
  `agent_count` int NOT NULL,
  `total_monthly_price` decimal(12,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('pending','active','expired','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `meals_provided` int NOT NULL DEFAULT '0',
  `meals_remaining` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_subscriptions_company_id_foreign` (`company_id`),
  KEY `company_subscriptions_pricing_tier_id_foreign` (`pricing_tier_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_subscriptions`
--

LOCK TABLES `company_subscriptions` WRITE;
/*!40000 ALTER TABLE `company_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_logs`
--

DROP TABLE IF EXISTS `delivery_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `meal_plan_id` bigint unsigned NOT NULL,
  `company_id` bigint unsigned NOT NULL,
  `delivery_date` date NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_delivered` int NOT NULL DEFAULT '1',
  `status` enum('pending','delivered','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `delivery_logs_meal_plan_id_foreign` (`meal_plan_id`),
  KEY `delivery_logs_company_id_foreign` (`company_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_logs`
--

LOCK TABLES `delivery_logs` WRITE;
/*!40000 ALTER TABLE `delivery_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_meal_plans`
--

DROP TABLE IF EXISTS `employee_meal_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_meal_plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company_employee_id` bigint unsigned NOT NULL,
  `subscription_id` bigint unsigned NOT NULL,
  `meal_id` bigint unsigned NOT NULL,
  `side_id` bigint unsigned NOT NULL,
  `valid_from` date NOT NULL,
  `valid_until` date NOT NULL,
  `status` enum('draft','confirmed','partial_delivered','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `meals_delivered` int NOT NULL DEFAULT '0',
  `meals_remaining` int NOT NULL DEFAULT '20',
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_meal_plans_company_employee_id_foreign` (`company_employee_id`),
  KEY `employee_meal_plans_subscription_id_foreign` (`subscription_id`),
  KEY `employee_meal_plans_meal_id_foreign` (`meal_id`),
  KEY `employee_meal_plans_side_id_foreign` (`side_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_meal_plans`
--

LOCK TABLES `employee_meal_plans` WRITE;
/*!40000 ALTER TABLE `employee_meal_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_meal_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_requests`
--

DROP TABLE IF EXISTS `event_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `guest_count` int unsigned NOT NULL,
  `budget` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_requests_user_id_foreign` (`user_id`),
  KEY `event_requests_status_created_at_index` (`status`,`created_at`),
  KEY `event_requests_responded_by_foreign` (`responded_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_requests`
--

LOCK TABLES `event_requests` WRITE;
/*!40000 ALTER TABLE `event_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_types`
--

DROP TABLE IF EXISTS `event_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_types_title_unique` (`title`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_types`
--

LOCK TABLES `event_types` WRITE;
/*!40000 ALTER TABLE `event_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fcm_tokens`
--

DROP TABLE IF EXISTS `fcm_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fcm_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fcm_tokens_token_unique` (`token`),
  KEY `fcm_tokens_user_id_index` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fcm_tokens`
--

LOCK TABLES `fcm_tokens` WRITE;
/*!40000 ALTER TABLE `fcm_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `fcm_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `subscription_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDF',
  `pdf_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoices_user_id_foreign` (`user_id`),
  KEY `invoices_order_id_foreign` (`order_id`),
  KEY `invoices_subscription_id_foreign` (`subscription_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'default','{\"uuid\":\"b8ec6144-11a0-4d32-9fb2-d89fcf1fa473\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"81b9f517-311e-47d7-b208-a48bb04325fe\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777403260,\"delay\":null}',0,NULL,1777403260,1777403260),(2,'default','{\"uuid\":\"200296e4-5264-40b9-8ae2-39f86408f1e0\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"2d4a6f55-aaab-49aa-b9fd-91b19eb2a795\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777403260,\"delay\":null}',0,NULL,1777403260,1777403260),(3,'default','{\"uuid\":\"f06dc076-a1fc-4324-a87c-9a7c9f469416\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"4bd6e8fc-29b5-4f4a-ba90-4bfcaf3513f2\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777403260,\"delay\":null}',0,NULL,1777403260,1777403260),(4,'default','{\"uuid\":\"d1c6e2d1-801d-4f8b-b849-3d69f5fa7d23\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:4;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"3d68e2cd-0522-4943-9165-c6ef5167c50d\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777403260,\"delay\":null}',0,NULL,1777403260,1777403260),(5,'default','{\"uuid\":\"dadb690b-c047-44dd-9dee-4514747dea10\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"48a41af2-eddf-4753-a8b6-a435f1933d35\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777403260,\"delay\":null}',0,NULL,1777403260,1777403260),(6,'default','{\"uuid\":\"cb6be40f-3ba1-407e-bd50-3782d1c7360c\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:6;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"7c835ad6-e9f6-46c9-8536-3359297e897f\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:18:\\\"NOTE D\'INFORMATION\\\";s:7:\\\"message\\\";s:194:\\\"Bonjour chers utilisateurs green express, nous sommes très heureux de vous compté parmi nous en ce moment car si vous êtes parmi  nos abonnés sachez que les bonnes choses arrivent bientôt !\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777403260,\"delay\":null}',0,NULL,1777403260,1777403260),(7,'default','{\"uuid\":\"d4df157f-0a91-492f-86f6-fd1299dd4763\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"aa50e5aa-f5c8-4567-8b35-d075904c52cc\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777406154,\"delay\":null}',0,NULL,1777406154,1777406154),(8,'default','{\"uuid\":\"bb3fab29-1b5b-4677-aa45-e170dea3c9e3\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"85fc5de4-d643-43c3-a64d-27339f4b47d4\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777406155,\"delay\":null}',0,NULL,1777406155,1777406155),(9,'default','{\"uuid\":\"3c4ed80f-980f-459c-9c31-4f6dc8f5fb65\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"74635eec-8f2d-4a4f-96ea-b9f60c9912d9\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777406155,\"delay\":null}',0,NULL,1777406155,1777406155),(10,'default','{\"uuid\":\"b8d105aa-1457-4340-8b13-8fea16a2acb7\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:4;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"08e9d869-7f93-4ab7-a920-0b6c98e38443\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777406155,\"delay\":null}',0,NULL,1777406155,1777406155),(11,'default','{\"uuid\":\"e4e8a156-e3bd-423b-8fdd-f24e461cd671\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"6d25b109-725a-46e6-8e65-7883c99fb448\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777406155,\"delay\":null}',0,NULL,1777406155,1777406155),(12,'default','{\"uuid\":\"03d2d481-41ad-436a-bb9a-77ce9e19869f\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:6;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\AnnouncementNotification\\\":4:{s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:6:\\\"sentBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:2:{i:0;s:11:\\\"permissions\\\";i:1;s:5:\\\"roles\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"aea813b3-90ec-4b4b-a82f-12014b919398\\\";}s:4:\\\"data\\\";a:8:{s:8:\\\"category\\\";s:12:\\\"announcement\\\";s:4:\\\"kind\\\";s:12:\\\"announcement\\\";s:5:\\\"title\\\";s:6:\\\"ALERTE\\\";s:7:\\\"message\\\";s:17:\\\"Nouvelle arrivage\\\";s:9:\\\"deep_link\\\";s:14:\\\"\\/notifications\\\";s:11:\\\"origin_type\\\";s:5:\\\"admin\\\";s:14:\\\"origin_user_id\\\";i:1;s:16:\\\"origin_user_name\\\";s:15:\\\"Admin Principal\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777406155,\"delay\":null}',0,NULL,1777406155,1777406155),(13,'default','{\"uuid\":\"d0c91c95-63d4-4571-9048-6f066a3ee58d\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\OrderCreatedNotification\\\":2:{s:5:\\\"order\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Order\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"5602cbdf-3cd3-4d8e-9bc8-7e6372b321eb\\\";}s:4:\\\"data\\\";a:13:{s:8:\\\"category\\\";s:5:\\\"order\\\";s:4:\\\"kind\\\";s:13:\\\"order_created\\\";s:8:\\\"order_id\\\";i:3;s:10:\\\"order_uuid\\\";s:36:\\\"a3a74f57-f362-4e77-afd2-5a0a302b0f27\\\";s:9:\\\"deep_link\\\";s:22:\\\"\\/client\\/orders?order=3\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"total_amount\\\";d:26.5;s:10:\\\"created_at\\\";s:25:\\\"2026-05-01T22:25:42+00:00\\\";s:5:\\\"title\\\";s:17:\\\"Nouvelle commande\\\";s:7:\\\"message\\\";s:38:\\\"Une nouvelle commande a été créée.\\\";s:11:\\\"origin_type\\\";s:6:\\\"client\\\";s:14:\\\"origin_user_id\\\";i:3;s:16:\\\"origin_user_name\\\";s:11:\\\"Client Test\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777674346,\"delay\":null}',0,NULL,1777674347,1777674347),(14,'default','{\"uuid\":\"ccf18a45-e7fc-4f51-9a3c-9ee058c0a9aa\",\"displayName\":\"App\\\\Events\\\\OrderRealtimeEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\OrderRealtimeEvent\\\":10:{s:7:\\\"orderId\\\";i:3;s:6:\\\"userId\\\";i:3;s:9:\\\"livreurId\\\";N;s:9:\\\"companyId\\\";N;s:4:\\\"uuid\\\";s:36:\\\"a3a74f57-f362-4e77-afd2-5a0a302b0f27\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"deliveryCode\\\";N;s:6:\\\"action\\\";s:7:\\\"created\\\";s:4:\\\"from\\\";N;s:2:\\\"to\\\";N;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777674351,\"delay\":null}',0,NULL,1777674351,1777674351),(15,'default','{\"uuid\":\"41799ed7-867b-470b-8d0d-547eee055d61\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\OrderCreatedNotification\\\":2:{s:5:\\\"order\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Order\\\";s:2:\\\"id\\\";i:4;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"8e0f57ec-5f9e-4f4b-becb-a9b438ab8a56\\\";}s:4:\\\"data\\\";a:13:{s:8:\\\"category\\\";s:5:\\\"order\\\";s:4:\\\"kind\\\";s:13:\\\"order_created\\\";s:8:\\\"order_id\\\";i:4;s:10:\\\"order_uuid\\\";s:36:\\\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\\\";s:9:\\\"deep_link\\\";s:22:\\\"\\/client\\/orders?order=4\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"total_amount\\\";d:110;s:10:\\\"created_at\\\";s:25:\\\"2026-05-01T23:06:22+00:00\\\";s:5:\\\"title\\\";s:17:\\\"Nouvelle commande\\\";s:7:\\\"message\\\";s:38:\\\"Une nouvelle commande a été créée.\\\";s:11:\\\"origin_type\\\";s:6:\\\"client\\\";s:14:\\\"origin_user_id\\\";i:3;s:16:\\\"origin_user_name\\\";s:11:\\\"Client Test\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777676783,\"delay\":null}',0,NULL,1777676783,1777676783),(16,'default','{\"uuid\":\"f6635032-3516-45bb-8d8a-9c81975bc9a4\",\"displayName\":\"App\\\\Events\\\\OrderRealtimeEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\OrderRealtimeEvent\\\":10:{s:7:\\\"orderId\\\";i:4;s:6:\\\"userId\\\";i:3;s:9:\\\"livreurId\\\";N;s:9:\\\"companyId\\\";N;s:4:\\\"uuid\\\";s:36:\\\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"deliveryCode\\\";N;s:6:\\\"action\\\";s:7:\\\"created\\\";s:4:\\\"from\\\";N;s:2:\\\"to\\\";N;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777676783,\"delay\":null}',0,NULL,1777676783,1777676783),(17,'default','{\"uuid\":\"75f6f70e-ac3b-4863-b426-ae8d58001ea2\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:48:\\\"App\\\\Notifications\\\\OrderStatusChangedNotification\\\":5:{s:5:\\\"order\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Order\\\";s:2:\\\"id\\\";i:4;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:4:\\\"from\\\";s:15:\\\"pending_payment\\\";s:2:\\\"to\\\";s:9:\\\"cancelled\\\";s:11:\\\"triggeredBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"57e9ed0a-59a2-4739-b729-505783b39455\\\";}s:4:\\\"data\\\";a:15:{s:8:\\\"category\\\";s:5:\\\"order\\\";s:4:\\\"kind\\\";s:20:\\\"order_status_changed\\\";s:8:\\\"order_id\\\";i:4;s:10:\\\"order_uuid\\\";s:36:\\\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\\\";s:9:\\\"deep_link\\\";s:22:\\\"\\/client\\/orders?order=4\\\";s:13:\\\"delivery_code\\\";N;s:4:\\\"from\\\";s:15:\\\"pending_payment\\\";s:2:\\\"to\\\";s:9:\\\"cancelled\\\";s:12:\\\"total_amount\\\";d:110;s:5:\\\"title\\\";s:30:\\\"Statut de commande mis à jour\\\";s:7:\\\"message\\\";s:38:\\\"Statut : pending_payment → cancelled\\\";s:10:\\\"updated_at\\\";s:25:\\\"2026-05-01T23:16:27+00:00\\\";s:11:\\\"origin_type\\\";s:6:\\\"client\\\";s:14:\\\"origin_user_id\\\";i:3;s:16:\\\"origin_user_name\\\";s:11:\\\"Client Test\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777677387,\"delay\":null}',0,NULL,1777677387,1777677387),(18,'default','{\"uuid\":\"d9bb7224-b30a-4dd5-8e80-dbf6f9325bc0\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:48:\\\"App\\\\Notifications\\\\OrderStatusChangedNotification\\\":5:{s:5:\\\"order\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Order\\\";s:2:\\\"id\\\";i:4;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:4:\\\"from\\\";s:15:\\\"pending_payment\\\";s:2:\\\"to\\\";s:9:\\\"cancelled\\\";s:11:\\\"triggeredBy\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"60bdacc5-e9d1-4415-9984-5d5224732411\\\";}s:4:\\\"data\\\";a:15:{s:8:\\\"category\\\";s:5:\\\"order\\\";s:4:\\\"kind\\\";s:20:\\\"order_status_changed\\\";s:8:\\\"order_id\\\";i:4;s:10:\\\"order_uuid\\\";s:36:\\\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\\\";s:9:\\\"deep_link\\\";s:22:\\\"\\/client\\/orders?order=4\\\";s:13:\\\"delivery_code\\\";N;s:4:\\\"from\\\";s:15:\\\"pending_payment\\\";s:2:\\\"to\\\";s:9:\\\"cancelled\\\";s:12:\\\"total_amount\\\";d:110;s:5:\\\"title\\\";s:30:\\\"Statut de commande mis à jour\\\";s:7:\\\"message\\\";s:38:\\\"Statut : pending_payment → cancelled\\\";s:10:\\\"updated_at\\\";s:25:\\\"2026-05-01T23:16:27+00:00\\\";s:11:\\\"origin_type\\\";s:6:\\\"client\\\";s:14:\\\"origin_user_id\\\";i:3;s:16:\\\"origin_user_name\\\";s:11:\\\"Client Test\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777677387,\"delay\":null}',0,NULL,1777677387,1777677387),(19,'default','{\"uuid\":\"21cf22f6-36f6-4c67-b297-afb1d001efc2\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\OrderCreatedNotification\\\":2:{s:5:\\\"order\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Order\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"39e21fe6-8a5e-47bd-8a63-c271eb8f36cd\\\";}s:4:\\\"data\\\";a:13:{s:8:\\\"category\\\";s:5:\\\"order\\\";s:4:\\\"kind\\\";s:13:\\\"order_created\\\";s:8:\\\"order_id\\\";i:5;s:10:\\\"order_uuid\\\";s:36:\\\"62d16ee7-fbe4-4bba-93d1-7f581fae3d21\\\";s:9:\\\"deep_link\\\";s:22:\\\"\\/client\\/orders?order=5\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"total_amount\\\";d:51250;s:10:\\\"created_at\\\";s:25:\\\"2026-05-05T02:08:00+00:00\\\";s:5:\\\"title\\\";s:17:\\\"Nouvelle commande\\\";s:7:\\\"message\\\";s:38:\\\"Une nouvelle commande a été créée.\\\";s:11:\\\"origin_type\\\";s:6:\\\"client\\\";s:14:\\\"origin_user_id\\\";i:3;s:16:\\\"origin_user_name\\\";s:11:\\\"Client Test\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777946881,\"delay\":null}',0,NULL,1777946881,1777946881),(20,'default','{\"uuid\":\"71b79030-9d7e-4571-be17-b6652a665711\",\"displayName\":\"App\\\\Events\\\\OrderRealtimeEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\OrderRealtimeEvent\\\":10:{s:7:\\\"orderId\\\";i:5;s:6:\\\"userId\\\";i:3;s:9:\\\"livreurId\\\";N;s:9:\\\"companyId\\\";N;s:4:\\\"uuid\\\";s:36:\\\"62d16ee7-fbe4-4bba-93d1-7f581fae3d21\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"deliveryCode\\\";N;s:6:\\\"action\\\";s:7:\\\"created\\\";s:4:\\\"from\\\";N;s:2:\\\"to\\\";N;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1777946881,\"delay\":null}',0,NULL,1777946881,1777946881),(21,'default','{\"uuid\":\"4db9f030-8bca-40eb-8330-5bfcc63e6429\",\"displayName\":\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:60:\\\"Illuminate\\\\Notifications\\\\Events\\\\BroadcastNotificationCreated\\\":3:{s:10:\\\"notifiable\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\User\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:12:\\\"notification\\\";O:42:\\\"App\\\\Notifications\\\\OrderCreatedNotification\\\":2:{s:5:\\\"order\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:16:\\\"App\\\\Models\\\\Order\\\";s:2:\\\"id\\\";i:6;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"id\\\";s:36:\\\"41f37bdc-b366-423c-960b-38acf8aa3342\\\";}s:4:\\\"data\\\";a:13:{s:8:\\\"category\\\";s:5:\\\"order\\\";s:4:\\\"kind\\\";s:13:\\\"order_created\\\";s:8:\\\"order_id\\\";i:6;s:10:\\\"order_uuid\\\";s:36:\\\"a26d4704-0880-45e9-9192-c5cba9e3ba30\\\";s:9:\\\"deep_link\\\";s:22:\\\"\\/client\\/orders?order=6\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"total_amount\\\";d:12500;s:10:\\\"created_at\\\";s:25:\\\"2026-05-10T01:55:02+00:00\\\";s:5:\\\"title\\\";s:17:\\\"Nouvelle commande\\\";s:7:\\\"message\\\";s:38:\\\"Une nouvelle commande a été créée.\\\";s:11:\\\"origin_type\\\";s:6:\\\"client\\\";s:14:\\\"origin_user_id\\\";i:3;s:16:\\\"origin_user_name\\\";s:11:\\\"Client Test\\\";}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1778378105,\"delay\":null}',0,NULL,1778378105,1778378105),(22,'default','{\"uuid\":\"ca7a9d3d-6e3c-46fd-9095-52747d711a36\",\"displayName\":\"App\\\\Events\\\\OrderRealtimeEvent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:29:\\\"App\\\\Events\\\\OrderRealtimeEvent\\\":10:{s:7:\\\"orderId\\\";i:6;s:6:\\\"userId\\\";i:3;s:9:\\\"livreurId\\\";N;s:9:\\\"companyId\\\";N;s:4:\\\"uuid\\\";s:36:\\\"a26d4704-0880-45e9-9192-c5cba9e3ba30\\\";s:6:\\\"status\\\";s:15:\\\"pending_payment\\\";s:12:\\\"deliveryCode\\\";N;s:6:\\\"action\\\";s:7:\\\"created\\\";s:4:\\\"from\\\";N;s:2:\\\"to\\\";N;}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1778378105,\"delay\":null}',0,NULL,1778378105,1778378105);
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meal_sides`
--

DROP TABLE IF EXISTS `meal_sides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_sides` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `company_menu_id` bigint unsigned NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meal_sides_company_menu_id_foreign` (`company_menu_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meal_sides`
--

LOCK TABLES `meal_sides` WRITE;
/*!40000 ALTER TABLE `meal_sides` DISABLE KEYS */;
/*!40000 ALTER TABLE `meal_sides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disk` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversions_disk` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` bigint unsigned NOT NULL DEFAULT '0',
  `manipulations` json DEFAULT NULL,
  `custom_properties` json DEFAULT NULL,
  `generated_conversions` json DEFAULT NULL,
  `responsive_images` json DEFAULT NULL,
  `order_column` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_uuid_unique` (`uuid`),
  KEY `media_model_type_model_id_index` (`model_type`,`model_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_by` bigint unsigned DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `available_from` timestamp NULL DEFAULT NULL,
  `available_to` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `menus_created_by_foreign` (`created_by`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
INSERT INTO `menus` VALUES (1,1,'Poulet aux frites',NULL,'Plat traditionnel congolais avec sauce moambe et bananes plantains.','https://res.cloudinary.com/dbyuftg6g/image/upload/v1778377910/green-express/menus/1778377909_69ffe4b50ede12.95745394.jpg',12500.00,'CDF','approved',1,0,NULL,NULL,'2026-04-20 00:13:35','2026-05-09 23:51:51'),(2,1,'Burger Gourmet',NULL,'Burger artisanal bœuf, frites maison et sauce signature.',NULL,12.50,'USD','approved',1,0,NULL,NULL,'2026-04-20 00:13:35','2026-04-20 00:13:35'),(3,1,'Salade César',NULL,'Salade fraîche avec poulet grillé, parmesan et croûtons.',NULL,8.00,'USD','approved',1,0,NULL,NULL,'2026-04-20 00:13:35','2026-04-20 00:13:35'),(4,1,'Pizza Margherita',NULL,'Pizza classique tomate, mozzarella et basilic frais.',NULL,10.00,'USD','approved',1,0,NULL,NULL,'2026-04-20 00:13:35','2026-04-20 00:13:35'),(5,1,'Poisson Braisé',NULL,'Poisson frais grillé avec attiéké et légumes.',NULL,20000.00,'CDF','approved',1,0,NULL,NULL,'2026-04-20 00:13:35','2026-04-20 00:13:35'),(6,1,'Saka-Saka',NULL,'Feuilles de manioc pilées avec poisson ou viande.',NULL,8000.00,'CDF','approved',1,0,NULL,NULL,'2026-04-20 00:13:35','2026-04-20 00:13:35');
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2024_03_14_000000_create_event_types_table',1),(5,'2026_02_05_235718_create_personal_access_tokens_table',1),(6,'2026_02_06_000101_create_profiles_table',1),(7,'2026_02_06_000102_create_menus_table',1),(8,'2026_02_06_000103_create_orders_tables',1),(9,'2026_02_06_000104_create_subscriptions_table',1),(10,'2026_02_06_000105_create_payments_table',1),(11,'2026_02_06_000106_create_promotions_points_reports_tables',1),(12,'2026_02_06_000200_add_role_to_users_table',1),(13,'2026_02_08_011700_add_currency_to_menus_table',1),(14,'2026_02_16_003024_add_image_to_menus_table',1),(15,'2026_02_18_000001_create_promotion_claims_table',1),(16,'2026_02_19_000001_add_livreur_id_to_orders',1),(17,'2026_02_19_000002_add_ticket_code_to_promotion_claims',1),(18,'2026_02_20_000001_add_promotion_own_fields',1),(19,'2026_02_23_000000_create_company_structure',1),(20,'2026_02_23_231634_create_permission_tables',1),(21,'2026_02_23_add_company_id_to_users',1),(22,'2026_02_23_create_agent_approvals_table',1),(23,'2026_02_24_000001_create_notifications_table',1),(24,'2026_02_24_add_period_currency_to_subscriptions_table',1),(25,'2026_02_25_000000_create_subscription_plans_table',1),(26,'2026_02_25_add_plan_id_to_subscriptions_table',1),(27,'2026_02_25_add_rejected_reason_to_subscriptions',1),(28,'2026_02_27_000001_add_fields_to_menus_table',1),(29,'2026_02_28_000001_create_event_requests_table',1),(30,'2026_02_28_000002_add_contact_to_event_requests',1),(31,'2026_02_28_000003_add_admin_response_to_event_requests',1),(32,'2026_03_09_000001_create_invoices_table',1),(33,'2026_03_09_100000_add_anti_webhook_loss_to_payments',1),(34,'2026_03_09_add_pending_employees_to_companies',1),(35,'2026_03_10_add_green_express_tier',1),(36,'2026_03_12_create_media_table',1),(37,'2026_03_17_000001_add_avatar_url_to_users_table',1),(38,'2026_03_27_120000_add_meal_types_and_scope_to_subscription_plans',1),(39,'2026_03_27_180000_create_subscription_plan_items_table',1),(40,'2026_03_28_000001_add_client_phone_number_to_orders_table',1),(41,'2026_03_28_000002_add_phone_to_users_table',1),(42,'2026_03_29_000001_add_requested_at_to_subscriptions_table',1),(43,'2026_04_10_120000_add_company_subscription_id_to_payments_table',1),(44,'2026_05_01_000001_add_currency_to_orders_and_order_items',2),(45,'2026_05_22_000001_create_fcm_tokens_table',3);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',1),(2,'App\\Models\\User',2),(3,'App\\Models\\User',3),(3,'App\\Models\\User',7),(4,'App\\Models\\User',4),(5,'App\\Models\\User',5),(6,'App\\Models\\User',6);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint unsigned NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`),
  KEY `notifications_notifiable_type_notifiable_id_read_at_index` (`notifiable_type`,`notifiable_id`,`read_at`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('81b9f517-311e-47d7-b208-a48bb04325fe','App\\Notifications\\AnnouncementNotification','App\\Models\\User',1,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"NOTE D\'INFORMATION\",\"message\":\"Bonjour chers utilisateurs green express, nous sommes tr\\u00e8s heureux de vous compt\\u00e9 parmi nous en ce moment car si vous \\u00eates parmi  nos abonn\\u00e9s sachez que les bonnes choses arrivent bient\\u00f4t !\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:07:40','2026-04-28 17:07:40'),('2d4a6f55-aaab-49aa-b9fd-91b19eb2a795','App\\Notifications\\AnnouncementNotification','App\\Models\\User',2,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"NOTE D\'INFORMATION\",\"message\":\"Bonjour chers utilisateurs green express, nous sommes tr\\u00e8s heureux de vous compt\\u00e9 parmi nous en ce moment car si vous \\u00eates parmi  nos abonn\\u00e9s sachez que les bonnes choses arrivent bient\\u00f4t !\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:07:40','2026-04-28 17:07:40'),('4bd6e8fc-29b5-4f4a-ba90-4bfcaf3513f2','App\\Notifications\\AnnouncementNotification','App\\Models\\User',3,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"NOTE D\'INFORMATION\",\"message\":\"Bonjour chers utilisateurs green express, nous sommes tr\\u00e8s heureux de vous compt\\u00e9 parmi nous en ce moment car si vous \\u00eates parmi  nos abonn\\u00e9s sachez que les bonnes choses arrivent bient\\u00f4t !\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}','2026-04-29 20:01:03','2026-04-28 17:07:40','2026-04-29 20:01:03'),('3d68e2cd-0522-4943-9165-c6ef5167c50d','App\\Notifications\\AnnouncementNotification','App\\Models\\User',4,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"NOTE D\'INFORMATION\",\"message\":\"Bonjour chers utilisateurs green express, nous sommes tr\\u00e8s heureux de vous compt\\u00e9 parmi nous en ce moment car si vous \\u00eates parmi  nos abonn\\u00e9s sachez que les bonnes choses arrivent bient\\u00f4t !\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:07:40','2026-04-28 17:07:40'),('48a41af2-eddf-4753-a8b6-a435f1933d35','App\\Notifications\\AnnouncementNotification','App\\Models\\User',5,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"NOTE D\'INFORMATION\",\"message\":\"Bonjour chers utilisateurs green express, nous sommes tr\\u00e8s heureux de vous compt\\u00e9 parmi nous en ce moment car si vous \\u00eates parmi  nos abonn\\u00e9s sachez que les bonnes choses arrivent bient\\u00f4t !\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:07:40','2026-04-28 17:07:40'),('7c835ad6-e9f6-46c9-8536-3359297e897f','App\\Notifications\\AnnouncementNotification','App\\Models\\User',6,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"NOTE D\'INFORMATION\",\"message\":\"Bonjour chers utilisateurs green express, nous sommes tr\\u00e8s heureux de vous compt\\u00e9 parmi nous en ce moment car si vous \\u00eates parmi  nos abonn\\u00e9s sachez que les bonnes choses arrivent bient\\u00f4t !\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:07:40','2026-04-28 17:07:40'),('aa50e5aa-f5c8-4567-8b35-d075904c52cc','App\\Notifications\\AnnouncementNotification','App\\Models\\User',1,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"ALERTE\",\"message\":\"Nouvelle arrivage\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:55:54','2026-04-28 17:55:54'),('85fc5de4-d643-43c3-a64d-27339f4b47d4','App\\Notifications\\AnnouncementNotification','App\\Models\\User',2,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"ALERTE\",\"message\":\"Nouvelle arrivage\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:55:55','2026-04-28 17:55:55'),('74635eec-8f2d-4a4f-96ea-b9f60c9912d9','App\\Notifications\\AnnouncementNotification','App\\Models\\User',3,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"ALERTE\",\"message\":\"Nouvelle arrivage\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}','2026-04-29 20:01:03','2026-04-28 17:55:55','2026-04-29 20:01:03'),('08e9d869-7f93-4ab7-a920-0b6c98e38443','App\\Notifications\\AnnouncementNotification','App\\Models\\User',4,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"ALERTE\",\"message\":\"Nouvelle arrivage\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:55:55','2026-04-28 17:55:55'),('6d25b109-725a-46e6-8e65-7883c99fb448','App\\Notifications\\AnnouncementNotification','App\\Models\\User',5,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"ALERTE\",\"message\":\"Nouvelle arrivage\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:55:55','2026-04-28 17:55:55'),('aea813b3-90ec-4b4b-a82f-12014b919398','App\\Notifications\\AnnouncementNotification','App\\Models\\User',6,'{\"category\":\"announcement\",\"kind\":\"announcement\",\"title\":\"ALERTE\",\"message\":\"Nouvelle arrivage\",\"deep_link\":\"\\/notifications\",\"origin_type\":\"admin\",\"origin_user_id\":1,\"origin_user_name\":\"Admin Principal\"}',NULL,'2026-04-28 17:55:55','2026-04-28 17:55:55'),('5602cbdf-3cd3-4d8e-9bc8-7e6372b321eb','App\\Notifications\\OrderCreatedNotification','App\\Models\\User',1,'{\"category\":\"order\",\"kind\":\"order_created\",\"order_id\":3,\"order_uuid\":\"a3a74f57-f362-4e77-afd2-5a0a302b0f27\",\"deep_link\":\"\\/client\\/orders?order=3\",\"status\":\"pending_payment\",\"total_amount\":26.5,\"created_at\":\"2026-05-01T22:25:42+00:00\",\"title\":\"Nouvelle commande\",\"message\":\"Une nouvelle commande a \\u00e9t\\u00e9 cr\\u00e9\\u00e9e.\",\"origin_type\":\"client\",\"origin_user_id\":3,\"origin_user_name\":\"Client Test\"}',NULL,'2026-05-01 20:25:46','2026-05-01 20:25:46'),('8e0f57ec-5f9e-4f4b-becb-a9b438ab8a56','App\\Notifications\\OrderCreatedNotification','App\\Models\\User',1,'{\"category\":\"order\",\"kind\":\"order_created\",\"order_id\":4,\"order_uuid\":\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\",\"deep_link\":\"\\/client\\/orders?order=4\",\"status\":\"pending_payment\",\"total_amount\":110,\"created_at\":\"2026-05-01T23:06:22+00:00\",\"title\":\"Nouvelle commande\",\"message\":\"Une nouvelle commande a \\u00e9t\\u00e9 cr\\u00e9\\u00e9e.\",\"origin_type\":\"client\",\"origin_user_id\":3,\"origin_user_name\":\"Client Test\"}',NULL,'2026-05-01 21:06:22','2026-05-01 21:06:22'),('57e9ed0a-59a2-4739-b729-505783b39455','App\\Notifications\\OrderStatusChangedNotification','App\\Models\\User',1,'{\"category\":\"order\",\"kind\":\"order_status_changed\",\"order_id\":4,\"order_uuid\":\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\",\"deep_link\":\"\\/client\\/orders?order=4\",\"delivery_code\":null,\"from\":\"pending_payment\",\"to\":\"cancelled\",\"total_amount\":110,\"title\":\"Statut de commande mis \\u00e0 jour\",\"message\":\"Statut : pending_payment \\u2192 cancelled\",\"updated_at\":\"2026-05-01T23:16:27+00:00\",\"origin_type\":\"client\",\"origin_user_id\":3,\"origin_user_name\":\"Client Test\"}',NULL,'2026-05-01 21:16:27','2026-05-01 21:16:27'),('60bdacc5-e9d1-4415-9984-5d5224732411','App\\Notifications\\OrderStatusChangedNotification','App\\Models\\User',3,'{\"category\":\"order\",\"kind\":\"order_status_changed\",\"order_id\":4,\"order_uuid\":\"5586ef22-d15c-401a-bc37-2b9189ec3b1e\",\"deep_link\":\"\\/client\\/orders?order=4\",\"delivery_code\":null,\"from\":\"pending_payment\",\"to\":\"cancelled\",\"total_amount\":110,\"title\":\"Statut de commande mis \\u00e0 jour\",\"message\":\"Statut : pending_payment \\u2192 cancelled\",\"updated_at\":\"2026-05-01T23:16:27+00:00\",\"origin_type\":\"client\",\"origin_user_id\":3,\"origin_user_name\":\"Client Test\"}',NULL,'2026-05-01 21:16:27','2026-05-01 21:16:27'),('39e21fe6-8a5e-47bd-8a63-c271eb8f36cd','App\\Notifications\\OrderCreatedNotification','App\\Models\\User',1,'{\"category\":\"order\",\"kind\":\"order_created\",\"order_id\":5,\"order_uuid\":\"62d16ee7-fbe4-4bba-93d1-7f581fae3d21\",\"deep_link\":\"\\/client\\/orders?order=5\",\"status\":\"pending_payment\",\"total_amount\":51250,\"created_at\":\"2026-05-05T02:08:00+00:00\",\"title\":\"Nouvelle commande\",\"message\":\"Une nouvelle commande a \\u00e9t\\u00e9 cr\\u00e9\\u00e9e.\",\"origin_type\":\"client\",\"origin_user_id\":3,\"origin_user_name\":\"Client Test\"}',NULL,'2026-05-05 00:08:01','2026-05-05 00:08:01'),('41f37bdc-b366-423c-960b-38acf8aa3342','App\\Notifications\\OrderCreatedNotification','App\\Models\\User',1,'{\"category\":\"order\",\"kind\":\"order_created\",\"order_id\":6,\"order_uuid\":\"a26d4704-0880-45e9-9192-c5cba9e3ba30\",\"deep_link\":\"\\/client\\/orders?order=6\",\"status\":\"pending_payment\",\"total_amount\":12500,\"created_at\":\"2026-05-10T01:55:02+00:00\",\"title\":\"Nouvelle commande\",\"message\":\"Une nouvelle commande a \\u00e9t\\u00e9 cr\\u00e9\\u00e9e.\",\"origin_type\":\"client\",\"origin_user_id\":3,\"origin_user_name\":\"Client Test\"}',NULL,'2026-05-09 23:55:04','2026-05-09 23:55:04');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `menu_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDF',
  `original_price` decimal(12,2) DEFAULT NULL,
  `original_currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_menu_id_foreign` (`menu_id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,2,2,12.50,'CDF',NULL,NULL,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(2,2,3,1,8.00,'CDF',NULL,NULL,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(3,3,3,1,8.00,'CDF',NULL,NULL,'2026-05-01 20:25:43','2026-05-01 20:25:43'),(4,3,2,1,12.50,'CDF',NULL,NULL,'2026-05-01 20:25:44','2026-05-01 20:25:44'),(5,3,1,1,6.00,'CDF',NULL,NULL,'2026-05-01 20:25:44','2026-05-01 20:25:44'),(6,4,1,1,110.00,'CDF',110.00,'CDF','2026-05-01 21:06:22','2026-05-01 21:06:22'),(7,5,2,1,31250.00,'CDF',12.50,'USD','2026-05-05 00:08:00','2026-05-05 00:08:00'),(8,5,3,1,20000.00,'CDF',8.00,'USD','2026-05-05 00:08:00','2026-05-05 00:08:00'),(9,6,1,1,12500.00,'CDF',12500.00,'CDF','2026-05-09 23:55:02','2026-05-09 23:55:02');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `livreur_id` bigint unsigned DEFAULT NULL,
  `company_id` bigint unsigned DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDF',
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `client_phone_number` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points_earned` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_uuid_unique` (`uuid`),
  KEY `orders_user_id_foreign` (`user_id`),
  KEY `orders_company_id_foreign` (`company_id`),
  KEY `orders_livreur_id_foreign` (`livreur_id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'f918919e-3b98-458a-b33e-cdd92ae3f7c8',3,NULL,NULL,'completed',25.00,'CDF','123 Avenue de la Paix, Kinshasa',NULL,'GX-XNVWNB',25,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(2,'eec2a7d9-5f75-48d8-8a7b-6421f9fbbcee',3,NULL,NULL,'pending',8.00,'CDF','456 Boulevard Lumumba, Kinshasa',NULL,'GX-3BFPFR',0,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(3,'a3a74f57-f362-4e77-afd2-5a0a302b0f27',3,NULL,NULL,'pending_payment',26.50,'CDF','ldk','243850167641',NULL,36,'2026-05-01 20:25:42','2026-05-01 20:25:42'),(4,'5586ef22-d15c-401a-bc37-2b9189ec3b1e',3,NULL,NULL,'cancelled',110.00,'CDF','ldk','243850167641',NULL,12,'2026-05-01 21:06:22','2026-05-01 21:16:26'),(5,'62d16ee7-fbe4-4bba-93d1-7f581fae3d21',3,NULL,NULL,'pending_payment',51250.00,'CDF','ldk','243850167641',NULL,24,'2026-05-05 00:08:00','2026-05-05 00:08:00'),(6,'a26d4704-0880-45e9-9192-c5cba9e3ba30',3,NULL,NULL,'pending_payment',12500.00,'CDF','chemin public','243850167641',NULL,12,'2026-05-09 23:55:02','2026-05-09 23:55:02');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned DEFAULT NULL,
  `subscription_id` bigint unsigned DEFAULT NULL,
  `company_subscription_id` bigint unsigned DEFAULT NULL,
  `provider` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_payment_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `last_checked_at` timestamp NULL DEFAULT NULL,
  `retry_count` tinyint unsigned NOT NULL DEFAULT '0',
  `failure_reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_order_id_foreign` (`order_id`),
  KEY `payments_subscription_id_foreign` (`subscription_id`),
  KEY `payments_company_subscription_id_foreign` (`company_subscription_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,4,NULL,NULL,'flexpay','mock_69f5321e602306.98949530','ORD-4-o2f21xwmoylm',110.00,'CDF','+243850167641','cancelled',NULL,0,'Annulée par le client','{\"id\": \"mock_69f5321e602306.98949530\", \"raw\": {\"code\": 0, \"message\": \"mock\", \"orderNumber\": \"mock_69f5321e602306.98949530\"}, \"amount\": 110, \"status\": \"pending\", \"currency\": \"CDF\", \"referenceId\": \"ORD-4-o2f21xwmoylm\"}','2026-05-01 21:07:10','2026-05-01 21:16:26'),(2,4,NULL,NULL,'flexpay','mock_69f532df365c37.85164376','ORD-4-jbjyubywlvxp',110.00,'CDF','+243850167641','cancelled',NULL,0,'Annulée par le client','{\"id\": \"mock_69f532df365c37.85164376\", \"raw\": {\"code\": 0, \"message\": \"mock\", \"orderNumber\": \"mock_69f532df365c37.85164376\"}, \"amount\": 110, \"status\": \"pending\", \"currency\": \"CDF\", \"referenceId\": \"ORD-4-jbjyubywlvxp\"}','2026-05-01 21:10:23','2026-05-01 21:16:26'),(3,4,NULL,NULL,'flexpay','mock_69f533e0e319e5.59080227','ORD-4-ypvdssuzoo7l',110.00,'CDF','+243850167641','cancelled',NULL,0,'Annulée par le client','{\"id\": \"mock_69f533e0e319e5.59080227\", \"raw\": {\"code\": 0, \"message\": \"mock\", \"orderNumber\": \"mock_69f533e0e319e5.59080227\"}, \"amount\": 110, \"status\": \"pending\", \"currency\": \"CDF\", \"referenceId\": \"ORD-4-ypvdssuzoo7l\"}','2026-05-01 21:14:40','2026-05-01 21:16:26');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=MyISAM AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'admin.agents','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(2,'admin.companies','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(3,'admin.company-subscriptions','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(4,'admin.deliveries','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(5,'admin.event-requests','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(6,'admin.event-types','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(7,'admin.exports','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(8,'admin.notifications.broadcast','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(9,'admin.operational','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(10,'admin.payments','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(11,'admin.reports','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(12,'admin.subscription-plans','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(13,'admin.subscriptions','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(14,'agent.dashboard','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(15,'agent.meal-plans','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(16,'b2b.meal-plans.manage','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(17,'company.employees.manage','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(18,'entreprise.b2b.access','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(19,'livreur.assignments.view-all','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(20,'menus.approve','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(21,'menus.create','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(22,'menus.delete','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(23,'menus.delete-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(24,'menus.edit','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(25,'menus.edit-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(26,'menus.list','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(27,'menus.list-approved','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(28,'menus.list-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(29,'menus.reject','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(30,'menus.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(31,'menus.view-approved','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(32,'menus.view-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(33,'operational.subscriptions.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(34,'orders.assign-livreur','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(35,'orders.cancel','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(36,'orders.cancel-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(37,'orders.change-status','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(38,'orders.create','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(39,'orders.delete','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(40,'orders.edit','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(41,'orders.list','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(42,'orders.list-assignments','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(43,'orders.list-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(44,'orders.list-own-menus','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(45,'orders.update-delivery-status','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(46,'orders.validate-delivery-code','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(47,'orders.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(48,'orders.view-assignments','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(49,'orders.view-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(50,'orders.view-own-menus','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(51,'promotions.claim','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(52,'promotions.create','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(53,'promotions.delete','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(54,'promotions.edit','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(55,'promotions.list','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(56,'promotions.manage','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(57,'promotions.validate-ticket','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(58,'promotions.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(59,'roles.manage_permissions','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(60,'stats.admin.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(61,'stats.client.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(62,'stats.cuisinier.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(63,'stats.entreprise.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(64,'stats.livreur.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(65,'stats.secretaire.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(66,'stats.verificateur.view','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(67,'subscriptions.cancel-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(68,'subscriptions.create','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(69,'subscriptions.delete','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(70,'subscriptions.edit','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(71,'subscriptions.list','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(72,'subscriptions.list-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(73,'subscriptions.view-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(74,'users.assign-role','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(75,'users.create','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(76,'users.delete','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(77,'users.edit','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(78,'users.list','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(79,'users.list-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(80,'users.view-own','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(81,'admin.agents','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(82,'admin.companies','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(83,'admin.company-subscriptions','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(84,'admin.deliveries','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(85,'admin.event-requests','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(86,'admin.event-types','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(87,'admin.exports','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(88,'admin.notifications.broadcast','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(89,'admin.operational','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(90,'admin.payments','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(91,'admin.reports','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(92,'admin.subscription-plans','api','2026-05-01 20:36:34','2026-05-01 20:36:34'),(93,'admin.subscriptions','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(94,'agent.dashboard','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(95,'agent.meal-plans','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(96,'b2b.meal-plans.manage','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(97,'company.employees.manage','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(98,'entreprise.b2b.access','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(99,'livreur.assignments.view-all','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(100,'menus.approve','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(101,'menus.create','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(102,'menus.delete','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(103,'menus.delete-own','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(104,'menus.edit','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(105,'menus.edit-own','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(106,'menus.list','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(107,'menus.list-approved','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(108,'menus.list-own','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(109,'menus.reject','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(110,'menus.view','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(111,'menus.view-approved','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(112,'menus.view-own','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(113,'operational.subscriptions.view','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(114,'orders.assign-livreur','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(115,'orders.cancel','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(116,'orders.cancel-own','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(117,'orders.change-status','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(118,'orders.create','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(119,'orders.delete','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(120,'orders.edit','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(121,'orders.list','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(122,'orders.list-assignments','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(123,'orders.list-own','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(124,'orders.list-own-menus','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(125,'orders.update-delivery-status','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(126,'orders.validate-delivery-code','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(127,'orders.view','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(128,'orders.view-assignments','api','2026-05-01 20:36:35','2026-05-01 20:36:35'),(129,'orders.view-own','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(130,'orders.view-own-menus','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(131,'promotions.claim','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(132,'promotions.create','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(133,'promotions.delete','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(134,'promotions.edit','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(135,'promotions.list','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(136,'promotions.manage','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(137,'promotions.validate-ticket','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(138,'promotions.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(139,'roles.manage_permissions','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(140,'stats.admin.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(141,'stats.client.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(142,'stats.cuisinier.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(143,'stats.entreprise.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(144,'stats.livreur.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(145,'stats.secretaire.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(146,'stats.verificateur.view','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(147,'subscriptions.cancel-own','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(148,'subscriptions.create','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(149,'subscriptions.delete','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(150,'subscriptions.edit','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(151,'subscriptions.list','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(152,'subscriptions.list-own','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(153,'subscriptions.view-own','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(154,'users.assign-role','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(155,'users.create','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(156,'users.delete','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(157,'users.edit','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(158,'users.list','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(159,'users.list-own','api','2026-05-01 20:36:36','2026-05-01 20:36:36'),(160,'users.view-own','api','2026-05-01 20:36:36','2026-05-01 20:36:36');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `point_ledgers`
--

DROP TABLE IF EXISTS `point_ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_ledgers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `delta` int NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `point_ledgers_user_id_foreign` (`user_id`),
  KEY `point_ledgers_order_id_foreign` (`order_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_ledgers`
--

LOCK TABLES `point_ledgers` WRITE;
/*!40000 ALTER TABLE `point_ledgers` DISABLE KEYS */;
/*!40000 ALTER TABLE `point_ledgers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `points`
--

DROP TABLE IF EXISTS `points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `points` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `balance` bigint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `points_user_id_foreign` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `points`
--

LOCK TABLES `points` WRITE;
/*!40000 ALTER TABLE `points` DISABLE KEYS */;
INSERT INTO `points` VALUES (1,3,120,'2026-04-20 00:13:35','2026-04-20 00:13:35');
/*!40000 ALTER TABLE `points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_tiers`
--

DROP TABLE IF EXISTS `pricing_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_tiers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_employees` int NOT NULL,
  `max_employees` int NOT NULL,
  `price_per_meal_usd` decimal(10,2) NOT NULL,
  `price_per_meal_cdf` decimal(12,2) NOT NULL,
  `exchange_rate` decimal(10,4) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_tiers`
--

LOCK TABLES `pricing_tiers` WRITE;
/*!40000 ALTER TABLE `pricing_tiers` DISABLE KEYS */;
INSERT INTO `pricing_tiers` VALUES (1,'Green Express',1,99999,1.50,3750.00,2500.0000,'USD','1,5 $ par jour, 20 jours = 30 $ par employé/mois',1,'2026-04-20 00:13:13','2026-04-20 00:13:13');
/*!40000 ALTER TABLE `pricing_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `profiles_user_id_foreign` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_claims`
--

DROP TABLE IF EXISTS `promotion_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_claims` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `promotion_id` bigint unsigned NOT NULL,
  `points_deducted` int DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'claimed',
  `ticket_code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotion_claims_user_id_promotion_id_unique` (`user_id`,`promotion_id`),
  UNIQUE KEY `promotion_claims_ticket_code_unique` (`ticket_code`),
  KEY `promotion_claims_user_id_index` (`user_id`),
  KEY `promotion_claims_promotion_id_index` (`promotion_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_claims`
--

LOCK TABLES `promotion_claims` WRITE;
/*!40000 ALTER TABLE `promotion_claims` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion_claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint unsigned DEFAULT NULL,
  `menu_id` bigint unsigned DEFAULT NULL,
  `image` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `points_required` int DEFAULT NULL,
  `discount` decimal(8,2) DEFAULT NULL,
  `start_at` timestamp NULL DEFAULT NULL,
  `end_at` timestamp NULL DEFAULT NULL,
  `quantity_limit` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `promotions_admin_id_foreign` (`admin_id`),
  KEY `promotions_menu_id_foreign` (`menu_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
INSERT INTO `promotions` VALUES (1,1,1,NULL,'LA FORCE DU GOUT',NULL,50,15.50,'2026-04-23 00:13:00','2026-04-30 00:13:00',501,'2026-04-20 00:13:38','2026-04-23 23:38:58'),(2,1,2,NULL,NULL,NULL,30,25.00,'2026-04-17 00:13:38','2026-04-30 00:13:38',50,'2026-04-20 00:13:38','2026-04-20 00:13:38');
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `generated_by` bigint unsigned DEFAULT NULL,
  `params` json DEFAULT NULL,
  `file_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reports_generated_by_foreign` (`generated_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(5,7),(6,1),(7,1),(8,1),(9,1),(10,1),(11,1),(12,1),(13,1),(14,1),(14,8),(15,1),(15,8),(16,1),(16,6),(17,1),(17,6),(18,1),(18,6),(19,1),(19,7),(20,1),(21,1),(21,2),(22,1),(23,1),(23,2),(24,1),(25,1),(25,2),(26,1),(27,1),(27,3),(27,8),(28,1),(28,2),(29,1),(30,1),(31,1),(31,3),(31,8),(32,1),(32,2),(33,1),(33,2),(34,1),(34,2),(34,7),(35,1),(36,1),(36,3),(37,1),(37,2),(38,1),(38,3),(39,1),(40,1),(40,7),(41,1),(41,7),(42,1),(42,4),(43,1),(43,3),(43,6),(44,1),(44,2),(45,1),(45,4),(46,1),(46,4),(47,1),(47,7),(48,1),(48,4),(49,1),(49,3),(49,6),(50,1),(50,2),(51,1),(51,3),(52,1),(53,1),(54,1),(55,1),(55,3),(55,5),(56,1),(57,1),(57,5),(58,1),(58,3),(58,5),(59,1),(60,1),(61,1),(61,3),(62,1),(62,2),(63,1),(63,6),(64,1),(64,4),(65,1),(65,7),(66,1),(66,5),(67,1),(67,3),(68,1),(68,3),(68,6),(69,1),(70,1),(71,1),(72,1),(72,6),(73,1),(73,3),(73,6),(74,1),(75,1),(76,1),(77,1),(78,1),(79,1),(79,6),(80,1),(80,6),(81,9),(82,9),(83,9),(84,9),(85,9),(85,15),(86,9),(87,9),(88,9),(89,9),(90,9),(91,9),(92,9),(93,9),(94,9),(94,16),(95,9),(95,16),(96,9),(96,14),(97,9),(97,14),(98,9),(98,14),(99,9),(99,15),(100,9),(101,9),(101,10),(102,9),(103,9),(103,10),(104,9),(105,9),(105,10),(106,9),(107,9),(107,11),(107,16),(108,9),(108,10),(109,9),(110,9),(111,9),(111,11),(111,16),(112,9),(112,10),(113,9),(113,10),(114,9),(114,10),(114,15),(115,9),(116,9),(116,11),(117,9),(117,10),(118,9),(118,11),(119,9),(120,9),(120,15),(121,9),(121,15),(122,9),(122,12),(123,9),(123,11),(123,14),(124,9),(124,10),(125,9),(125,12),(126,9),(126,12),(127,9),(127,15),(128,9),(128,12),(129,9),(129,11),(129,14),(130,9),(130,10),(131,9),(131,11),(132,9),(133,9),(134,9),(135,9),(135,11),(135,13),(136,9),(137,9),(137,13),(138,9),(138,11),(138,13),(139,9),(140,9),(141,9),(141,11),(142,9),(142,10),(143,9),(143,14),(144,9),(144,12),(145,9),(145,15),(146,9),(146,13),(147,9),(147,11),(148,9),(148,11),(148,14),(149,9),(150,9),(151,9),(152,9),(152,14),(153,9),(153,11),(153,14),(154,9),(155,9),(156,9),(157,9),(158,9),(159,9),(159,14),(160,9),(160,14);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','web','2026-04-20 00:13:39','2026-04-20 00:13:39'),(2,'cuisinier','web','2026-04-20 00:13:41','2026-04-20 00:13:41'),(3,'client','web','2026-04-20 00:13:41','2026-04-20 00:13:41'),(4,'livreur','web','2026-04-20 00:13:41','2026-04-20 00:13:41'),(5,'verificateur','web','2026-04-20 00:13:42','2026-04-20 00:13:42'),(6,'entreprise','web','2026-04-20 00:13:42','2026-04-20 00:13:42'),(7,'secretaire','web','2026-04-20 00:13:42','2026-04-20 00:13:42'),(8,'agent','web','2026-04-20 00:13:42','2026-04-20 00:13:42'),(9,'admin','api','2026-05-01 20:36:47','2026-05-01 20:36:47'),(10,'cuisinier','api','2026-05-01 20:36:49','2026-05-01 20:36:49'),(11,'client','api','2026-05-01 20:36:49','2026-05-01 20:36:49'),(12,'livreur','api','2026-05-01 20:36:49','2026-05-01 20:36:49'),(13,'verificateur','api','2026-05-01 20:36:49','2026-05-01 20:36:49'),(14,'entreprise','api','2026-05-01 20:36:49','2026-05-01 20:36:49'),(15,'secretaire','api','2026-05-01 20:36:49','2026-05-01 20:36:49'),(16,'agent','api','2026-05-01 20:36:49','2026-05-01 20:36:49');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_history`
--

DROP TABLE IF EXISTS `subscription_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subscription_id` bigint unsigned NOT NULL,
  `company_id` bigint unsigned NOT NULL,
  `action` enum('created','activated','renewed','upgraded','downgraded','expired','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_count_before` int DEFAULT NULL,
  `agent_count_after` int DEFAULT NULL,
  `price_before` decimal(12,2) DEFAULT NULL,
  `price_after` decimal(12,2) DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `performed_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscription_history_subscription_id_foreign` (`subscription_id`),
  KEY `subscription_history_company_id_foreign` (`company_id`),
  KEY `subscription_history_performed_by_foreign` (`performed_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_history`
--

LOCK TABLES `subscription_history` WRITE;
/*!40000 ALTER TABLE `subscription_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plan_items`
--

DROP TABLE IF EXISTS `subscription_plan_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plan_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subscription_plan_id` bigint unsigned NOT NULL,
  `menu_id` bigint unsigned DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meal_slot` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscription_plan_items_subscription_plan_id_foreign` (`subscription_plan_id`),
  KEY `subscription_plan_items_menu_id_foreign` (`menu_id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plan_items`
--

LOCK TABLES `subscription_plan_items` WRITE;
/*!40000 ALTER TABLE `subscription_plan_items` DISABLE KEYS */;
INSERT INTO `subscription_plan_items` VALUES (1,1,NULL,'Déjeuner — variante du Lundi','Assiette structurée : protéine, féculent et légumes ; composition adaptée à la rotation hebdomadaire.','https://picsum.photos/seed/gx-bas-1/640/480','Lundi',0,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(2,1,NULL,'Déjeuner — variante du Mardi','Assiette structurée : protéine, féculent et légumes ; composition adaptée à la rotation hebdomadaire.','https://picsum.photos/seed/gx-bas-2/640/480','Mardi',1,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(3,1,NULL,'Déjeuner — variante du Mercredi','Assiette structurée : protéine, féculent et légumes ; composition adaptée à la rotation hebdomadaire.','https://picsum.photos/seed/gx-bas-3/640/480','Mercredi',2,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(4,1,NULL,'Déjeuner — variante du Jeudi','Assiette structurée : protéine, féculent et légumes ; composition adaptée à la rotation hebdomadaire.','https://picsum.photos/seed/gx-bas-4/640/480','Jeudi',3,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(5,1,NULL,'Déjeuner — variante du Vendredi','Assiette structurée : protéine, féculent et légumes ; composition adaptée à la rotation hebdomadaire.','https://picsum.photos/seed/gx-bas-5/640/480','Vendredi',4,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(6,2,NULL,'Lundi · midi et soir','Déjeuner : plat du jour et accompagnement. Dîner : repas chaud équilibré, portions adaptées au soir.','https://picsum.photos/seed/gx-std-1/640/480','Lundi',0,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(7,2,NULL,'Mardi · midi et soir','Déjeuner : plat du jour et accompagnement. Dîner : repas chaud équilibré, portions adaptées au soir.','https://picsum.photos/seed/gx-std-2/640/480','Mardi',1,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(8,2,NULL,'Mercredi · midi et soir','Déjeuner : plat du jour et accompagnement. Dîner : repas chaud équilibré, portions adaptées au soir.','https://picsum.photos/seed/gx-std-3/640/480','Mercredi',2,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(9,2,NULL,'Jeudi · midi et soir','Déjeuner : plat du jour et accompagnement. Dîner : repas chaud équilibré, portions adaptées au soir.','https://picsum.photos/seed/gx-std-4/640/480','Jeudi',3,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(10,2,NULL,'Vendredi · midi et soir','Déjeuner : plat du jour et accompagnement. Dîner : repas chaud équilibré, portions adaptées au soir.','https://picsum.photos/seed/gx-std-5/640/480','Vendredi',4,'2026-04-20 00:13:39','2026-04-20 00:13:39'),(11,3,NULL,'Lundi · formule intégrale','Déjeuner (carte du chef), dîner avec note sucrée légère, collation après-midi — trois temps sur la journée ouvrée.','https://picsum.photos/seed/gx-pre-1/640/480','Lundi',0,'2026-04-20 00:13:39','2026-04-20 00:13:39'),(12,3,NULL,'Mardi · formule intégrale','Déjeuner (carte du chef), dîner avec note sucrée légère, collation après-midi — trois temps sur la journée ouvrée.','https://picsum.photos/seed/gx-pre-2/640/480','Mardi',1,'2026-04-20 00:13:39','2026-04-20 00:13:39'),(13,3,NULL,'Mercredi · formule intégrale','Déjeuner (carte du chef), dîner avec note sucrée légère, collation après-midi — trois temps sur la journée ouvrée.','https://picsum.photos/seed/gx-pre-3/640/480','Mercredi',2,'2026-04-20 00:13:39','2026-04-20 00:13:39'),(14,3,NULL,'Jeudi · formule intégrale','Déjeuner (carte du chef), dîner avec note sucrée légère, collation après-midi — trois temps sur la journée ouvrée.','https://picsum.photos/seed/gx-pre-4/640/480','Jeudi',3,'2026-04-20 00:13:39','2026-04-20 00:13:39'),(15,3,NULL,'Vendredi · formule intégrale','Déjeuner (carte du chef), dîner avec note sucrée légère, collation après-midi — trois temps sur la journée ouvrée.','https://picsum.photos/seed/gx-pre-5/640/480','Vendredi',4,'2026-04-20 00:13:39','2026-04-20 00:13:39');
/*!40000 ALTER TABLE `subscription_plan_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `plan_scope` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both',
  `meal_types` json DEFAULT NULL,
  `highlights` json DEFAULT NULL,
  `price_week` decimal(12,2) NOT NULL DEFAULT '0.00',
  `price_month` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDF',
  `days_per_week` tinyint unsigned NOT NULL DEFAULT '5',
  `days_per_month` tinyint unsigned NOT NULL DEFAULT '20',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'Basique','Formule d’accès pour une semaine de travail (lundi à vendredi) : un déjeuner structuré chaque jour ouvré, pensé pour une alimentation équilibrée au rythme du bureau.','individual','[{\"emoji\": \"🍽️\", \"label\": \"Déjeuner\", \"detail\": \"Mise en assiette complète : protéine, féculent, légumes de saison et boisson — renouvelée chaque jour ouvré.\"}]','[\"Cinq jours ouvrés par cycle (lundi–vendredi, hors week-end)\", \"Une même structure de repas, avec une rotation hebdomadaire des recettes\", \"Renouvellement par période hebdomadaire\"]',25000.00,100000.00,'CDF',5,20,1,1,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(2,'Standard','Pour chaque jour ouvré, deux temps forts : le midi et le soir. Une couverture alimentaire complète sans charge cognitive pour l’organisation des repas.','individual','[{\"emoji\": \"☀️\", \"label\": \"Déjeuner\", \"detail\": \"Proposition du jour, garniture et boisson — alignée sur le calendrier des jours ouvrés.\"}, {\"emoji\": \"🌙\", \"label\": \"Dîner\", \"detail\": \"Repas du soir dosé en calories et en volume pour une fin de journée confortable.\"}]','[\"Dix prestations repas par semaine (deux par jour sur cinq jours ouvrés)\", \"Tarification et engagement exprimés à la semaine\", \"Formule la plus demandée par nos clients particuliers\"]',30000.00,120000.00,'CDF',5,20,1,2,'2026-04-20 00:13:38','2026-04-20 00:13:38'),(3,'Premium','L’offre la plus étendue : déjeuner, dîner et collation structurée, pour une couverture nutritionnelle continue sur l’ensemble de la journée ouvrée.','individual','[{\"emoji\": \"☀️\", \"label\": \"Déjeuner\", \"detail\": \"Carte du chef, portions adaptées, alternative végétarienne sur demande.\"}, {\"emoji\": \"🌙\", \"label\": \"Dîner\", \"detail\": \"Service complet incluant une note sucrée légère en fin de repas.\"}, {\"emoji\": \"🥤\", \"label\": \"Collation\", \"detail\": \"Boisson et encas pour l’après-midi, calibrés sur la même semaine ouvrée.\"}]','[\"Quinze prestations repas par semaine (trois par jour sur cinq jours ouvrés)\", \"Priorité sur les créneaux de livraison\", \"Carte renouvelée chaque semaine calendaire\"]',37500.00,150000.00,'CDF',5,20,1,3,'2026-04-20 00:13:39','2026-04-20 00:13:39');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `subscription_plan_id` bigint unsigned DEFAULT NULL,
  `plan` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `period` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'month',
  `currency` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDF',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `started_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT NULL,
  `rejected_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscriptions_uuid_unique` (`uuid`),
  KEY `subscriptions_user_id_foreign` (`user_id`),
  KEY `subscriptions_subscription_plan_id_foreign` (`subscription_plan_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (1,'9a7bc9e7-cda3-4df7-9ff9-86311f0c2d0b',3,NULL,'Semaine',9.99,'month','CDF','active','2026-04-17 00:13:38','2026-04-24 00:13:38',NULL,NULL,'2026-04-20 00:13:38','2026-04-20 00:13:38');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` bigint unsigned DEFAULT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`),
  KEY `users_company_id_foreign` (`company_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin Principal','admin@test.com','243888888888',NULL,NULL,'admin','2026-05-24 19:45:44','$2y$12$UFqCh/Hia.j8fjHkcNHSeOEolYUnpyOAJ3uF5DHZ2Qx1gU8DTEsgC',NULL,'2026-04-20 00:13:34','2026-05-24 19:45:44'),(2,'Chef Cuisinier','cuisinier@test.com','243777777777',NULL,NULL,'cuisinier',NULL,'$2y$12$21IZRVsAWYbn6ftee/Ydbe2C62NvfEDOk9/JlPhovxyALhenzmJri',NULL,'2026-04-20 00:13:35','2026-05-09 07:33:12'),(3,'Client Test','client@test.com','243999999999',NULL,NULL,'client','2026-05-24 19:45:42','$2y$12$90uNgS7owmQOh4aqJkFr0.Yj6Ty65lUZgdRXsL3GEbcTJuh7FqHjm',NULL,'2026-04-20 00:13:35','2026-05-24 19:45:42'),(4,'Livreur Express','livreur@test.com','243666666666',NULL,NULL,'livreur','2026-05-24 19:45:45','$2y$12$vkIZ2fTMkDNAPDJ5MhfKXeBbRI2InBFQ48HJxBUYTnyHOdLwL5flq',NULL,'2026-04-20 00:13:35','2026-05-24 19:45:45'),(5,'Verificateur QR','verificateur@test.com',NULL,NULL,NULL,'verificateur',NULL,'$2y$12$H3v9LF/xdjsIqBcqtg91SuLa8ghOlSsirNkd68X6eCmAnhSfWN3em',NULL,'2026-04-20 00:13:35','2026-04-20 00:13:35'),(6,'Entreprise Demo','entreprise@test.com','243555555555',NULL,NULL,'entreprise','2026-05-24 17:43:08','$2y$12$6bkBilvU13xPs9SHixtl8udwKHcHsmtsvRhSPeDiGU.t4.jssui.C',NULL,'2026-04-20 00:13:35','2026-05-24 19:45:43'),(7,'DANIEL MUELA','danmuela476@gmail.com',NULL,'https://lh3.googleusercontent.com/a/ACg8ocJVLFE_k08ZPYy-qIEKb10FZ9u-bP6sbDHIPiX4vucMMhjE_TyR=s96-c',NULL,'client','2026-05-21 21:36:19','$2y$12$ll2vZo0BsUhd/3L33sQ1JuzNRTLQvbl5g2EVEJXG7bAZUqvHhzmqa',NULL,'2026-05-21 21:36:20','2026-05-21 21:36:20');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'db_gexpress'
--

--
-- Dumping routines for database 'db_gexpress'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-27 23:55:22
