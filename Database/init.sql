CREATE TABLE athletes (atl_id int primary key, name VARCHAR(255), hometown VARCHAR(10000), gender VARCHAR(100), birthyear VARCHAR(100), games VARCHAR(1000), hostlocation VARCHAR(1000), startdate DATE, enddate DATE, age int, type VARCHAR(100), contingent VARCHAR(100), sport VARCHAR(100), gprofile VARCHAR(1000), team VARCHAR(100), finalpos int);

CREATE TABLE games (game_id int primary key, gamename VARCHAR(255), gamedate VARCHAR(100), gametype VARCHAR(255), gameinfo VARCHAR(7000), linktogame VARCHAR(500));

CREATE TABLE results (team_id int  primary key, province VARCHAR(100), sgamesg INT, sgamess INT, sgamesb INT, wgamesg INT, wgamess INT, wgamesb INT, total INT);

CREATE TABLE teams (id int primary key, name VARCHAR(255), info VARCHAR(7000));

CREATE TABLE sports (sport_id int primary key, sportname VARCHAR(255), sportinfo VARCHAR(10000), sportpackage VARCHAR(1000));