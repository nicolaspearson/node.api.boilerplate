CREATE TABLE user (
	id int auto_increment NOT NULL PRIMARY KEY,
    username varchar(255) NOT NULL,
    email_address varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    created_at timestamp default now(),
    updated_at timestamp default now() on update now(),
    last_logged_in_at timestamp default now(),
    UNIQUE (username),
    UNIQUE (email_address)
);
