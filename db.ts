import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

const db = new DB();

db.execute(`
CREATE TABLE IF NOT EXISTS accounts (
	id 			INTEGER 	PRIMARY KEY AUTOINCREMENT,
	username 	TEXT 		NOT NUll UNIQUE,
	password 	TEXT 		NOT NULL,
	ip 			TEXT
);
INSERT INTO accounts(username, password) VALUES ('khang', '123456');
INSERT INTO accounts(username, password) VALUES ('dat', '123456');

CREATE TABLE IF NOT EXISTS friends (
	id 			INTEGER 									NOT NULL,
	friendId 	INTEGER 									NOT NULL,
	state 		TEXT CHECK(state IN ('sent', 'friended'))   NOT NULL, 
	PRIMARY KEY (id, friendId)
);
`);

// accounts Query 

export const findAccount = db.prepareQuery<
	never,
	{ id: number; username: string; password: string; ip: string | null },
	{ username: string }
>(
	"SELECT id, username, password, ip FROM accounts WHERE username = :username;",
);
export const addAccount = db.prepareQuery<
	never,
	never,
	{ username: string; password: string }
>(
	"INSERT INTO accounts(username, password) VALUES (:username, :password);",
);

export const setIP = db.prepareQuery<
	never,
	never,
	{ id: number; ip: string | null }
>(`
UPDATE accounts
SET ip = :ip
WHERE id = :id
;`);

// friends Query

export const sendRequest = db.prepareQuery<
	never,
	never,
	{ id: number; friendId: number }
>(
	"INSERT INTO friends(id, friendId, state) VALUES (:id, :friendId, 'sent');",
);

export const acceptRequest = db.prepareQuery<
	never,
	never,
	{ id: number; friendId: number }
>(`
UPDATE friends
SET state = 'friended'
WHERE friendId = :id AND id = :friendId 
;`);
