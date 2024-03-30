ALTER TABLE actaeon_user_ext
	DROP CONSTRAINT fk_team;
ALTER TABLE actaeon_user_ext
	ADD CONSTRAINT fk_team FOREIGN KEY(team) REFERENCES actaeon_teams(uuid)
    ON DELETE SET NULL ON UPDATE CASCADE;
