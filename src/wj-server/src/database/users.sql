CREATE TABLE user(
    id INT,
    email VARCHAR(50),
    username VARCHAR(50),
    password VARCHAR(50),
    is_google_account BOOLEAN,
    CONSTRAINT user_pk PRIMARY KEY(id)
);

-- Example data
-- INSERT INTO user (id, email, username, password, is_google_account) VALUES (1, 'testemail@gmail.com', 'testuser', 'testpassword123', true)