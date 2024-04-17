ALTER TABLE measuringDevices ADD `isDeleted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE occupants ADD `isDeleted` integer DEFAULT false NOT NULL;