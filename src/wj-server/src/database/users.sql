CREATE TABLE user(
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    picture VARCHAR(100),
    CONSTRAINT user_pk PRIMARY KEY(id),
    CONSTRAINT user_unique UNIQUE (email)
);

-- Example data
-- INSERT INTO user (id, email, name, picture) VALUES (1, 'testemail@gmail.com', 'Test Name', 'url.com')