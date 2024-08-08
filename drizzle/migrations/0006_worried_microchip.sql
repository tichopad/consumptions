ALTER TABLE `billingPeriods` ADD `isDeleted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `billingPeriods` ADD `deleted` integer;--> statement-breakpoint
ALTER TABLE `billingPeriods` ADD `isArchived` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `billingPeriods` ADD `archived` integer;