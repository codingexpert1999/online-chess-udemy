CREATE DATABASE online_chess_udemy; 

USE online_chess_udemy;

-- Tables
CREATE TABLE users(
	id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE user_info(
	user_id INT,
    user_rank ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    user_points INT DEFAULT 1000,
    KEY userID(user_id),
    CONSTRAINT userID FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE games(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timer VARCHAR(2),
    moves TEXT NOT NULL,
    user_id_light INT,
    user_id_black INT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY userID_Light(user_id_light),
    CONSTRAINT userID_Light FOREIGN KEY(user_id_light) REFERENCES users(id) ON DELETE CASCADE,
    KEY userID_Black(user_id_black),
    CONSTRAINT userID_Black FOREIGN KEY(user_id_black) REFERENCES users(id) ON DELETE CASCADE
);

-- Procedures
DELIMITER $$
CREATE PROCEDURE createUser(
	IN _username VARCHAR(255),
    IN _email VARCHAR(255),
    IN _password VARCHAR(255)
)
BEGIN
	DECLARE userId INT;
    
    INSERT INTO users(username, email, password) VALUES(_username, _email, _password);
    SELECT id INTO userId FROM users WHERE username=_username;
    INSERT INTO user_info(user_id) VALUE(userId);
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE updateScores(
	IN username_1 VARCHAR(255),
    IN points_1 INT,
    IN username_2 VARCHAR(255),
    IN points_2 INT
)
BEGIN
	DECLARE userId_1 INT;
    DECLARE userId_2 INT;
    DECLARE user_rank_1 VARCHAR(20) DEFAULT "beginner";
    DECLARE user_rank_2 VARCHAR(20) DEFAULT "beginner";
    
    SELECT id INTO userId_1 FROM users WHERE username=username_1;
    SELECT id INTO userId_2 FROM users WHERE username=username_2;
    
    IF points_1 < 2000 THEN
		SET user_rank_1 := "beginner";
	ELSEIF points_1 < 3000 THEN
		SET user_rank_1 := "intermediate";
	ELSEIF points_1 < 4000 THEN
		SET user_rank_1 := "advanced";
	ELSE
		SET user_rank_1 := "expert";
	END IF;
    
    IF points_2 < 2000 THEN
		SET user_rank_2 := "beginner";
	ELSEIF points_2 < 3000 THEN
		SET user_rank_2 := "intermediate";
	ELSEIF points_2 < 4000 THEN
		SET user_rank_2 := "advanced";
	ELSE
		SET user_rank_2 := "expert";
	END IF;
    
    UPDATE user_info SET user_points=points_1, user_rank=user_rank_1 WHERE id=userId_1;
    UPDATE user_info SET user_points=points_2, user_rank=user_rank_2 WHERE id=userId_2;
END $$
DELIMITER ;