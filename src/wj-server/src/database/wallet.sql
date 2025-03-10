CREATE TABLE wallet(
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    wallet_name VARCHAR(50),
    balance FLOAT,
    CONSTRAINT wallet_pk PRIMARY KEY (id),
    CONSTRAINT wallet_fk FOREIGN KEY (user_id) REFERENCES user(id)
);