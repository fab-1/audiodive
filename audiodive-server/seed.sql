
DROP TABLE IF EXISTS `archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archive` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` bigint DEFAULT NULL,
  `fromModel` varchar(255) DEFAULT NULL,
  `originalRecord` longtext,
  `originalRecordId` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archive`
--

LOCK TABLES `archive` WRITE;
/*!40000 ALTER TABLE `archive` DISABLE KEYS */;
/*!40000 ALTER TABLE `archive` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ClipLayouts`
--

DROP TABLE IF EXISTS `ClipLayouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClipLayouts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `config` text,
  `configSquare` json DEFAULT NULL,
  `configWide` json DEFAULT NULL,
  `configVertical` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `FeedId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FeedId` (`FeedId`),
  CONSTRAINT `cliplayouts_ibfk_1` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ClipLayouts`
--

LOCK TABLES `ClipLayouts` WRITE;
/*!40000 ALTER TABLE `ClipLayouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `ClipLayouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Clips`
--

DROP TABLE IF EXISTS `Clips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Clips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `start` float DEFAULT NULL,
  `end` float DEFAULT NULL,
  `totalDuration` int DEFAULT NULL,
  `ratio` enum('configSquare','configVertical','configWide') COLLATE utf8mb4_unicode_ci DEFAULT 'configSquare',
  `status` enum('pending','processing','ready', 'transcribing', 'cutting') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `audioUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streamUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `originalAudioUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `config` json DEFAULT NULL,
  `metaData` json DEFAULT NULL,
  `UserId` int DEFAULT NULL,
  `scheduledAt` datetime DEFAULT NULL,
  `isPremium` tinyint(1) DEFAULT NULL,
  `unlocked` tinyint(1) DEFAULT NULL,
  `isMusic` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `PodcastId` int DEFAULT NULL,
  `FeedId` int DEFAULT NULL,
  `TemplateId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PodcastId` (`PodcastId`),
  KEY `FeedId` (`FeedId`),
  KEY `TemplateId` (`TemplateId`),
  CONSTRAINT `clips_ibfk_1` FOREIGN KEY (`PodcastId`) REFERENCES `Podcasts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `clips_ibfk_2` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `clips_ibfk_3` FOREIGN KEY (`TemplateId`) REFERENCES `Templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Clips`
--

LOCK TABLES `Clips` WRITE;
/*!40000 ALTER TABLE `Clips` DISABLE KEYS */;
/*!40000 ALTER TABLE `Clips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ClipVideos`
--

DROP TABLE IF EXISTS `ClipVideos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClipVideos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `videoUrl` varchar(255) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `gifUrl` varchar(255) DEFAULT NULL,
  `previewUrl` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `ratio` varchar(255) DEFAULT NULL,
  `ready` tinyint(1) DEFAULT NULL,
  `highlightId` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `ClipId` int DEFAULT NULL,
  `UserId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ClipId` (`ClipId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `clipvideos_ibfk_1` FOREIGN KEY (`ClipId`) REFERENCES `Clips` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `clipvideos_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ClipVideos`
--

LOCK TABLES `ClipVideos` WRITE;
/*!40000 ALTER TABLE `ClipVideos` DISABLE KEYS */;
/*!40000 ALTER TABLE `ClipVideos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CreatorAssets`
--

DROP TABLE IF EXISTS `CreatorAssets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CreatorAssets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `type` enum('audio','video','image','font') NOT NULL DEFAULT 'image',
  `CreatorId` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `FeedId` int DEFAULT NULL,
  `UserId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FeedId` (`FeedId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `creatorassets_ibfk_1` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `creatorassets_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CreatorAssets`
--

LOCK TABLES `CreatorAssets` WRITE;
/*!40000 ALTER TABLE `CreatorAssets` DISABLE KEYS */;
/*!40000 ALTER TABLE `CreatorAssets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Feeds`
--

DROP TABLE IF EXISTS `Feeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Feeds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `resizedImage` varchar(255) DEFAULT NULL,
  `playImage` varchar(255) DEFAULT NULL,
  `messengerImage` varchar(255) DEFAULT NULL,
  `metaData` json DEFAULT NULL,
  `itunesUrl` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `jsonUrl` varchar(255) DEFAULT NULL,
  `rssFeedUrl` varchar(255) DEFAULT NULL,
  `autoRefresh` tinyint(1) DEFAULT '0',
  `autoSend` tinyint(1) DEFAULT '0',
  `autoImportWeblinks` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Feeds`
--

LOCK TABLES `Feeds` WRITE;
/*!40000 ALTER TABLE `Feeds` DISABLE KEYS */;
/*!40000 ALTER TABLE `Feeds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `NetworkCreators`
--

DROP TABLE IF EXISTS `NetworkCreators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NetworkCreators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('admin','contributor','creative','host') NOT NULL DEFAULT 'contributor',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `NetworkId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `NetworkId` (`NetworkId`),
  CONSTRAINT `networkcreators_ibfk_1` FOREIGN KEY (`NetworkId`) REFERENCES `Networks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `NetworkCreators`
--

LOCK TABLES `NetworkCreators` WRITE;
/*!40000 ALTER TABLE `NetworkCreators` DISABLE KEYS */;
/*!40000 ALTER TABLE `NetworkCreators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Networks`
--

DROP TABLE IF EXISTS `Networks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Networks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Networks`
--

LOCK TABLES `Networks` WRITE;
/*!40000 ALTER TABLE `Networks` DISABLE KEYS */;
/*!40000 ALTER TABLE `Networks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Podcasts`
--

DROP TABLE IF EXISTS `Podcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Podcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `date` datetime DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `shortTitle` varchar(255) DEFAULT NULL,
  `altImage` varchar(255) DEFAULT NULL,
  `playImage` varchar(255) DEFAULT NULL,
  `extraData` text,
  `metaData` json DEFAULT NULL,
  `links` text,
  `audioUrl` varchar(255) DEFAULT NULL,
  `guid` varchar(255) DEFAULT NULL,
  `type` enum('episode','teaser','patreon') NOT NULL DEFAULT 'episode',
  `isTeaser` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `FeedId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `feed_guid` (`FeedId`,`guid`),
  CONSTRAINT `podcasts_ibfk_1` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Podcasts`
--

LOCK TABLES `Podcasts` WRITE;
/*!40000 ALTER TABLE `Podcasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `Podcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PodcastSubscriptions`
--

DROP TABLE IF EXISTS `PodcastSubscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PodcastSubscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `FeedId` int DEFAULT NULL,
  `UserId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FeedId` (`FeedId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `podcastsubscriptions_ibfk_1` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `podcastsubscriptions_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PodcastSubscriptions`
--

LOCK TABLES `PodcastSubscriptions` WRITE;
/*!40000 ALTER TABLE `PodcastSubscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `PodcastSubscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Subscriptions`
--

DROP TABLE IF EXISTS `Subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `UserId` int DEFAULT NULL,
  `data` json DEFAULT NULL,
  `utcHour` int DEFAULT NULL,
  `endPoint` varchar(255) DEFAULT NULL,
  `type` enum('daily') DEFAULT 'daily',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Subscriptions`
--

LOCK TABLES `Subscriptions` WRITE;
/*!40000 ALTER TABLE `Subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `Subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Templates`
--

DROP TABLE IF EXISTS `Templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `configSquare` json DEFAULT NULL,
  `configWide` json DEFAULT NULL,
  `configVertical` json DEFAULT NULL,
  `configInsta` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `FeedId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FeedId` (`FeedId`),
  CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Templates`
--

LOCK TABLES `Templates` WRITE;
/*!40000 ALTER TABLE `Templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `Templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `createdAt` bigint DEFAULT NULL,
  `updatedAt` bigint DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `emailAddress` varchar(255) DEFAULT NULL,
  `emailStatus` varchar(255) DEFAULT NULL,
  `emailChangeCandidate` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullName` varchar(255) DEFAULT NULL,
  `isSuperAdmin` tinyint(1) DEFAULT NULL,
  `passwordResetToken` varchar(255) DEFAULT NULL,
  `passwordResetTokenExpiresAt` double DEFAULT NULL,
  `inviteToken` varchar(255) DEFAULT NULL,
  `inviteTokenExpiresAt` double DEFAULT NULL,
  `emailProofToken` varchar(255) DEFAULT NULL,
  `emailProofTokenExpiresAt` double DEFAULT NULL,
  `stripeCustomerId` varchar(255) DEFAULT NULL,
  `hasBillingCard` tinyint(1) DEFAULT NULL,
  `billingCardBrand` varchar(255) DEFAULT NULL,
  `billingCardLast4` varchar(255) DEFAULT NULL,
  `billingCardExpMonth` varchar(255) DEFAULT NULL,
  `billingCardExpYear` varchar(255) DEFAULT NULL,
  `tosAcceptedByIp` varchar(255) DEFAULT NULL,
  `lastSeenAt` double DEFAULT NULL,
  `membershipStartedAt` datetime DEFAULT NULL,
  `accessLevel` double DEFAULT NULL,
  `stripeSubscriptionId` varchar(255) DEFAULT NULL,
  `stripeInvoiceId` varchar(255) DEFAULT NULL,
  `stripePlanId` varchar(255) DEFAULT NULL,
  `affiliateCode` varchar(255) DEFAULT NULL,
  `isAffiliate` tinyint(1) DEFAULT NULL,
  `ReferrerId` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `emailAddress` (`emailAddress`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserClips`
--

DROP TABLE IF EXISTS `UserClips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserClips` (
  `ClipId` int NOT NULL,
  `UserId` int NOT NULL,
  `role` enum('owner','contributor','purchaser') NOT NULL DEFAULT 'contributor',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`ClipId`,`UserId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `userclips_ibfk_1` FOREIGN KEY (`ClipId`) REFERENCES `Clips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userclips_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserClips`
--

LOCK TABLES `UserClips` WRITE;
/*!40000 ALTER TABLE `UserClips` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserClips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserFriends`
--

DROP TABLE IF EXISTS `UserFriends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserFriends` (
  `FriendId` int NOT NULL,
  `UserId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`FriendId`,`UserId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `userfriends_ibfk_1` FOREIGN KEY (`FriendId`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `userfriends_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserFriends`
--

LOCK TABLES `UserFriends` WRITE;
/*!40000 ALTER TABLE `UserFriends` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserFriends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserHighlights`
--

DROP TABLE IF EXISTS `UserHighlights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserHighlights` (
  `id` int NOT NULL AUTO_INCREMENT,
  `UserId` int DEFAULT NULL,
  `data` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `userhighlights_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserHighlights`
--

LOCK TABLES `UserHighlights` WRITE;
/*!40000 ALTER TABLE `UserHighlights` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserHighlights` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserPodcasts`
--

DROP TABLE IF EXISTS `UserPodcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserPodcasts` (
  `FeedId` int NOT NULL,
  `UserId` int NOT NULL,
  `role` enum('owner','subscriber') NOT NULL DEFAULT 'subscriber',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`FeedId`,`UserId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `userpodcasts_ibfk_1` FOREIGN KEY (`FeedId`) REFERENCES `Feeds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userpodcasts_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserPodcasts`
--

LOCK TABLES `UserPodcasts` WRITE;
/*!40000 ALTER TABLE `UserPodcasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserPodcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserSavedClips`
--

DROP TABLE IF EXISTS `UserSavedClips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserSavedClips` (
  `ClipId` int NOT NULL,
  `UserId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`ClipId`,`UserId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `usersavedclips_ibfk_1` FOREIGN KEY (`ClipId`) REFERENCES `Clips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `usersavedclips_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserSavedClips`
--

LOCK TABLES `UserSavedClips` WRITE;
/*!40000 ALTER TABLE `UserSavedClips` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserSavedClips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserSavedTemplates`
--

DROP TABLE IF EXISTS `UserSavedTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserSavedTemplates` (
  `TemplateId` int NOT NULL,
  `UserId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`TemplateId`,`UserId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `usersavedtemplates_ibfk_1` FOREIGN KEY (`TemplateId`) REFERENCES `Templates` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `usersavedtemplates_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserSavedTemplates`
--

LOCK TABLES `UserSavedTemplates` WRITE;
/*!40000 ALTER TABLE `UserSavedTemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserSavedTemplates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserTemplates`
--

DROP TABLE IF EXISTS `UserTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserTemplates` (
  `TemplateId` int NOT NULL,
  `UserId` int NOT NULL,
  `role` enum('owner','contributor') NOT NULL DEFAULT 'contributor',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`TemplateId`,`UserId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `usertemplates_ibfk_1` FOREIGN KEY (`TemplateId`) REFERENCES `Templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `usertemplates_ibfk_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserTemplates`
--

LOCK TABLES `UserTemplates` WRITE;
/*!40000 ALTER TABLE `UserTemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserTemplates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-06-25 20:58:41
INSERT INTO audiodive.Templates
(id, name, configSquare, configWide, configVertical, configInsta, createdAt, updatedAt, FeedId)
VALUES(1, 'Social template light', '{"canvas": {"objects": [{"id": "textArea", "rx": 0, "ry": 0, "top": 195.29071, "fill": "rgba(0,0,0,0)", "left": 50, "name": "Dynamic Text", "type": "rect", "angle": 0, "width": 600, "clipTo": null, "height": 400, "scaleX": 1.03333, "scaleY": 0.99751, "originX": "left", "originY": "top", "version": "3.6.6", "visible": true}, {"id": "html_vDFbyFp5e", "rx": 0, "ry": 0, "top": 60, "fill": "rgba(0,0,0,0)", "left": 74.46413, "name": "title", "type": "htmlText", "angle": 0, "width": 600, "clipTo": null, "height": 260, "scaleX": 0.95278, "scaleY": 0.23439, "originX": "left", "originY": "top", "version": "3.6.6", "visible": true}, {"id": "visArea", "rx": 0, "ry": 0, "top": 617.4941, "fill": "rgba(0,0,0,0)", "left": 446.36364, "name": "visualization", "type": "rect", "angle": 0, "width": 600, "clipTo": null, "height": 260, "scaleX": 0.41096, "scaleY": 0.30375, "originX": "left", "originY": "top", "version": "3.6.6", "visible": true}, {"id": "progress", "rx": 0, "ry": 0, "top": 714, "fill": "rgba(0,0,0,0)", "left": 0, "name": "progress", "type": "rect", "angle": 0, "width": 600, "clipTo": null, "height": 20, "scaleX": 1.2, "scaleY": 0.3, "originX": "left", "originY": "top", "version": "3.6.6", "visible": true}], "version": "3.6.6", "background": "rgba(0,0,0,0)"}, "hideTransition": {"easing": "Sine", "duration": 0.2, "cssProperty": "opacity", "acceleration": "easeOut"}, "linkedElements": {"visArea": {"bar": {}, "gap": 3, "type": "bar", "hAlign": "center", "vAlign": "center", "opacity": 1, "hslColor": {"h": 60, "l": 96, "s": 21}, "sampleSize": 25, "animateColor": true, "colorVariation": {"h": 0, "l": 7, "s": 0}}, "progress": {"color": "rgba(0,0,0,0.9)", "backgroundColor": "rgba(255,255,255, 0.8)"}, "textArea": {"color": "rgba(1,1,1, 1)", "fontSize": 44, "textAlign": "center", "fontFamily": "Montserrat", "fontWeight": "600", "lineHeight": 2, "wordEasing": "easeOut", "wordEffect": "Sine", "paddingLeft": 10, "fontVariants": ["100", "100italic", "200", "200italic", "300", "300italic", "regular", "italic", "500", "500italic", "600", "600italic", "700", "700italic", "800", "800italic", "900", "900italic"], "paddingRight": 10, "wordAnimation": "opacity", "wordScrolling": "wordbyword", "textShadowColor": "rgba(4, 4, 4, 1)", "textShadowOffsetX": "0", "textShadowOffsetY": "2"}, "J8GnXT7r7": {"gifSettings": {}}, "SNFlP0k5t": {"gifSettings": {}}, "html_vDFbyFp5e": {"color": "rgba(1,1,1, 1)", "content": "{clipName}", "fontSize": 40, "textAlign": "center", "fontFamily": "Montserrat", "lineHeight": 1.5, "paddingTop": "0", "fontVariants": ["100", "100italic", "200", "200italic", "300", "300italic", "regular", "italic", "500", "500italic", "600", "600italic", "700", "700italic", "800", "800italic", "900", "900italic"], "backgroundColor": "rgba(255, 255, 255, 0)"}}, "previewPicture": null}', '{"canvas": {"objects": [{"id": "dynamicArea", "rx": 0, "ry": 0, "top": 0, "fill": "rgba(0,0,0,0)", "left": 0, "name": "Media Layer", "type": "rect", "angle": 0, "flipX": false, "flipY": false, "skewX": 0, "skewY": 0, "width": 720, "clipTo": null, "height": 720, "scaleX": 1, "scaleY": 1, "shadow": null, "stroke": null, "opacity": 1, "originX": "left", "originY": "top", "version": "2.3.3", "visible": true, "fillRule": "nonzero", "paintFirst": "fill", "strokeWidth": 1, "strokeLineCap": "butt", "strokeLineJoin": "miter", "backgroundColor": "", "strokeDashArray": null, "transformMatrix": null, "strokeMiterLimit": 4, "globalCompositeOperation": "source-over"}], "version": "2.3.2", "backgroundColor": "rgba(0,0,0,0)"}, "linkedElements": {"dynamicArea": {}}}', '{"canvas": {"objects": [], "version": "2.3.2", "backgroundColor": "rgba(0,0,0,0)"}, "linkedElements": {"dynamicArea": {}}}', NULL, '2019-05-28 01:07:30', '2023-06-01 01:56:15', 1);
