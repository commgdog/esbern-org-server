CREATE TABLE `audits` (
  `auditId` UUID NOT NULL,
  `requestId` UUID NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `modelType` VARCHAR(255) NOT NULL,
  `modelId` UUID NOT NULL,
  `changes` JSON DEFAULT NULL,
  PRIMARY KEY (`auditId`),
  INDEX `requestId` (`requestId`),
  INDEX `modelType` (`modelType`),
  INDEX `modelId` (`modelId`)
);

CREATE TABLE `requests` (
  `requestId` UUID NOT NULL,
  `userId` UUID DEFAULT NULL,
  `timestamp` DATETIME(3) NOT NULL,
  `sessionToken` UUID DEFAULT NULL,
  `method` VARCHAR(255) DEFAULT NULL,
  `path` VARCHAR(255) DEFAULT NULL,
  `statusCode` SMALLINT(3) UNSIGNED DEFAULT NULL,
  `ipAddress` VARCHAR(255) DEFAULT NULL,
  `userAgent` TEXT DEFAULT NULL,
  `durationMs` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`requestId`),
  INDEX `userId` (`userId`)
);

CREATE TABLE `rolePermissions` (
  `roleId` UUID NOT NULL,
  `permission` VARCHAR(255) NOT NULL,
  UNIQUE KEY `rolePermissions_roleId_permission` (`roleId`, `permission`),
  INDEX `roleId` (`roleId`),
  INDEX `permission` (`permission`)
);

CREATE TABLE `roles` (
  `roleId` UUID NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `name` (`name`)
);

CREATE TABLE `userRoles` (
  `userId` UUID NOT NULL,
  `roleId` UUID NOT NULL,
  UNIQUE KEY `userRoles_userId_roleId` (`userId`, `roleId`),
  INDEX `userId` (`userId`),
  INDEX `roleId` (`roleId`)
);

CREATE TABLE `users` (
  `userId` UUID NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `passwordIsExpired` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  `firstName` VARCHAR(50) NOT NULL,
  `lastName` VARCHAR(50) NOT NULL,
  `homePage` VARCHAR(255) NOT NULL DEFAULT 'dashboard',
  `lastToken` UUID DEFAULT NULL,
  `tokenExpires` DATETIME DEFAULT NULL,
  `loginAttemptCount` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `lastLoginAttemptAt` DATETIME DEFAULT NULL,
  `lifetimeLoginCount` INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `isInactive` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `users_lastToken` (`lastToken`),
  UNIQUE KEY `username` (`username`),
  INDEX `lastToken` (`lastToken`),
  INDEX `tokenExpires` (`tokenExpires`),
  INDEX `isInactive` (`isInactive`)
);

ALTER TABLE `audits`
  ADD CONSTRAINT `audits_requestId` FOREIGN KEY (`requestId`) REFERENCES `requests` (`requestId`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `rolePermissions`
  ADD CONSTRAINT `rolePermissions_roleId` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `userRoles`
  ADD CONSTRAINT `userRoles_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `userRoles_roleId` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON UPDATE CASCADE ON DELETE CASCADE;
