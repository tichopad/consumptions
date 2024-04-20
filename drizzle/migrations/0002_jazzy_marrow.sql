ALTER TABLE billingPeriods ADD `created` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE billingPeriods ADD `updated` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE buildings ADD `created` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE buildings ADD `updated` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE consumptionRecords ADD `created` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE consumptionRecords ADD `updated` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE energyBills ADD `created` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE energyBills ADD `updated` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE energyBills ADD `costPerUnit` real;--> statement-breakpoint
ALTER TABLE energyBills ADD `costPerSquareMeter` real;--> statement-breakpoint
ALTER TABLE energyBills ADD `consumption` real;--> statement-breakpoint
ALTER TABLE energyBills ADD `billedArea` real;--> statement-breakpoint
ALTER TABLE measuringDevices ADD `created` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE measuringDevices ADD `updated` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE occupants ADD `created` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE occupants ADD `updated` integer DEFAULT (strftime('%s','now')) NOT NULL;