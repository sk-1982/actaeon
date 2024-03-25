CREATE TABLE actaeon_teams (
    uuid CHAR(36),
    visibility INT NOT NULL,
    joinPrivacy INT NOT NULL,
    name VARCHAR(255),
    owner INT NOT NULL,

    chuniTeam INT NOT NULL,

    PRIMARY KEY (uuid),
    FOREIGN KEY (chuniTeam) REFERENCES chuni_profile_team(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (owner) REFERENCES aime_user(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
