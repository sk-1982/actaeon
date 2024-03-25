CREATE TABLE actaeon_user_ext (
    userId INT NOT NULL,
    uuid CHAR(36) NOT NULL,
    visibility INT NOT NULL,

    homepage VARCHAR(64),

    PRIMARY KEY (userId),
    UNIQUE KEY (uuid),
    FOREIGN KEY (userId) REFERENCES aime_user(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
