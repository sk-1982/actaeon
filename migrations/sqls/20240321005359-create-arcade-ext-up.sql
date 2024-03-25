CREATE TABLE actaeon_arcade_ext (
    arcadeId INT NOT NULL,
    uuid CHAR(36) NOT NULL,
    visibility INT NOT NULL,
    joinPrivacy INT NOT NULL,

    PRIMARY KEY (arcadeId),
    UNIQUE KEY (uuid),
    FOREIGN KEY (arcadeId) REFERENCES arcade(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
