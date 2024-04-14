CREATE TABLE `billingPeriods` (
	`id` text PRIMARY KEY NOT NULL,
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`buildingId` text NOT NULL,
	FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `buildings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`squareMeters` integer
);
--> statement-breakpoint
CREATE TABLE `consumptionRecords` (
	`id` text PRIMARY KEY NOT NULL,
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`energyType` text NOT NULL,
	`consumption` real NOT NULL,
	`measuringDeviceId` text NOT NULL,
	FOREIGN KEY (`measuringDeviceId`) REFERENCES `measuringDevices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `energyBills` (
	`id` text PRIMARY KEY NOT NULL,
	`energyType` text NOT NULL,
	`totalCost` real NOT NULL,
	`fixedCost` real,
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`buildingId` text,
	`occupantId` text,
	`billingPeriodId` text NOT NULL,
	FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`occupantId`) REFERENCES `occupants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`billingPeriodId`) REFERENCES `billingPeriods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `measuringDevices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`energyType` text NOT NULL,
	`occupantId` text NOT NULL,
	FOREIGN KEY (`occupantId`) REFERENCES `occupants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `occupants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`squareMeters` integer NOT NULL,
	`chargedUnmeasuredElectricity` integer DEFAULT false NOT NULL,
	`chargedUnmeasuredHeating` integer DEFAULT false NOT NULL,
	`chargedUnmeasuredWater` integer DEFAULT false NOT NULL,
	`heatingFixedCostShare` real,
	`buildingId` text NOT NULL,
	FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE no action
);
