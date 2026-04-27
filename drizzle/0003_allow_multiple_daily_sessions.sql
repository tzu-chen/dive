DROP INDEX `sessions_book_day_unique`;--> statement-breakpoint
CREATE INDEX `sessions_book_idx` ON `sessions` (`book_id`);