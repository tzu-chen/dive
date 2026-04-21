CREATE TABLE `book_metadata_cache` (
	`query_hash` text PRIMARY KEY NOT NULL,
	`response_json` text NOT NULL,
	`fetched_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `books` (
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
	CONSTRAINT "books_status_check" CHECK("books"."status" IN ('want', 'reading', 'finished', 'abandoned'))
);
--> statement-breakpoint
CREATE INDEX `books_status_idx` ON `books` (`status`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`page` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "notes_kind_check" CHECK("notes"."kind" IN ('quote', 'thought'))
);
--> statement-breakpoint
CREATE INDEX `notes_book_idx` ON `notes` (`book_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`read_on` text NOT NULL,
	`start_page` integer NOT NULL,
	`end_page` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "sessions_page_range_check" CHECK("sessions"."end_page" >= "sessions"."start_page")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_book_day_unique` ON `sessions` (`book_id`,`read_on`);--> statement-breakpoint
CREATE INDEX `sessions_read_on_idx` ON `sessions` (`read_on`);