CREATE TABLE actaeon_user_friends (
    user1 INT NOT NULL,
    user2 INT NOT NULL,

    PRIMARY KEY (user1, user2),
    FOREIGN KEY (user1) REFERENCES aime_user(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user2) REFERENCES aime_user(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
