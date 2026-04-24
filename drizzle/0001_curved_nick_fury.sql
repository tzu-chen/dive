PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`authors` text DEFAULT '[]' NOT NULL,
	`isbn_13` text,
	`open_library_id` text,
	`page_count` integer,
	`published_year` integer,
	`cover_url` text,
	`cover_path` text,
	`status` text DEFAULT 'want' NOT NULL,
	`started_at` text,
	`finished_at` text,
	`abandoned_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "books_status_check" CHECK("__new_books"."status" IN ('want', 'owned', 'reading', 'finished', 'abandoned'))
);
--> statement-breakpoint
INSERT INTO `__new_books`("id", "title", "authors", "isbn_13", "open_library_id", "page_count", "published_year", "cover_url", "cover_path", "status", "started_at", "finished_at", "abandoned_at", "created_at", "updated_at") SELECT "id", "title", "authors", "isbn_13", "open_library_id", "page_count", "published_year", "cover_url", "cover_path", "status", "started_at", "finished_at", "abandoned_at", "created_at", "updated_at" FROM `books`;--> statement-breakpoint
DROP TABLE `books`;--> statement-breakpoint
ALTER TABLE `__new_books` RENAME TO `books`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `books_status_idx` ON `books` (`status`);