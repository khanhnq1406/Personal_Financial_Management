CREATE TABLE user(
    id INT,
    email VARCHAR(50),
    name VARCHAR(100),
    picture VARCHAR(100),
    CONSTRAINT user_pk PRIMARY KEY(id)
);

-- Example data
-- INSERT INTO user (id, email, name, picture) VALUES (1, 'testemail@gmail.com', 'Test Name', 'url.com')