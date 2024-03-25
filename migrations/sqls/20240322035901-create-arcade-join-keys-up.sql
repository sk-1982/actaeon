CREATE TABLE actaeon_arcade_join_keys (
    id CHAR(10) NOT NULL,
    arcadeId INT NOT NULL,

    remainingUses INT DEFAULT NULL,
    totalUses INT NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    FOREIGN KEY (arcadeId) REFERENCES arcade(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
