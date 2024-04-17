ALTER TABLE actaeon_chuni_static_map_icon CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE actaeon_chuni_static_music_ext CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE actaeon_chuni_static_music_ext CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE actaeon_chuni_static_name_plate CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE actaeon_chuni_static_system_voice CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE actaeon_chuni_static_trophies CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE actaeon_global_config CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE actaeon_teams MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE actaeon_user_ext MODIFY COLUMN dashboard VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
