CREATE TABLE `family_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`family_member_name` varchar(255) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_type` enum('image','document','text') NOT NULL,
	`mime_type` varchar(100),
	`file_key` varchar(500) NOT NULL,
	`file_url` text,
	`file_size` int,
	`description` text,
	`uploaded_by` int NOT NULL,
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_files_id` PRIMARY KEY(`id`)
);
