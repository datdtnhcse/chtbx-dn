import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";
import { Friend, FriendStatus } from "../protocol/request_response.ts";

type Account = {
	id: number;
	username: string;
	password: string;
	ip: string | null;
	port: number | null;
};

type Friendship = {
	id: number;
	friendId: number;
	state: "sent" | "received" | "friended";
};

const db = new DB();

db.execute(`
CREATE TABLE IF NOT EXISTS accounts (
	id 			INTEGER 	PRIMARY KEY AUTOINCREMENT,
	username 	TEXT 		NOT NUll UNIQUE,
	password 	TEXT 		NOT NULL,
	ip 			TEXT,
	port 		INTEGER
);
INSERT INTO accounts(username, password) VALUES ('khang', '123456');
INSERT INTO accounts(username, password) VALUES ('dat', '123456');
INSERT INTO accounts(username, password) VALUES ('bkhang', '123456');



CREATE TABLE IF NOT EXISTS friends (
	id 			INTEGER 												NOT NULL,
	friendId 	INTEGER 												NOT NULL,
	state 		TEXT CHECK(state IN ('sent', 'received', 'friended'))   NOT NULL,
	PRIMARY KEY (id, friendId)
);

INSERT INTO friends(id, friendId, state)
VALUES	(1, 2, 'friended'),
		(2, 1, 'friended')
;`);

// accounts Query

export const findAccountByUsername = db.prepareQuery<
	never,
	Account,
	{ username: string }
>(`
	SELECT 	id, username, password, ip, port
	FROM 	accounts
	WHERE 	username = :username
;`);

export const findAccountById = db.prepareQuery<
	never,
	Account,
	{ id: number }
>(`
	SELECT 	id, username, password, ip, port
	FROM 	accounts
	WHERE 	id = :id
;`);

export const addAccount = db.prepareQuery<
	never,
	never,
	{
		username: string;
		password: string;
	}
>(`
	INSERT
	INTO 	accounts(username, password)
	VALUES 	(:username, :password)
;`);

export const setIP = db.prepareQuery<
	never,
	never,
	{ id: number; ip: string | null; port: number | null }
>(`
	UPDATE 	accounts
	SET 	ip = :ip,
			port = :port
	WHERE 	id = :id
;`);

// friends Query

export const sendFriendRequest = db.prepareQuery<
	never,
	never,
	{ id: number; friendId: number }
>(`
	INSERT
	INTO 	friends(id, friendId, state)
	VALUES 	(:id, :friendId, 'sent'),
			(:friendId, :id, 'received')
;`);

export const findRequestExisted = db.prepareQuery<
	never,
	Pick<Friendship, "state">,
	{ id: number; friendId: number }
>(`
	SELECT 	friends.state
	FROM 	friends
	WHERE 	id = :id
	  AND 	friendId = :friendId
;`);

export const sendBackRequest = db.prepareQuery<
	never,
	never,
	{ id: number; friendId: number }
>(`
	UPDATE 	friends
	SET 	state = 'friended'
	WHERE 	(id = :id AND friendId = :friendId)
   	   OR 	(id = :friendId AND friendId = :id)
;`);

export const getFriendlist = (id: number): Friend[] => {
	const query = db.prepareQuery<
		never,
		Account & Friendship,
		{ id: number }
	>(`
		SELECT 	accounts.username, accounts.ip, accounts.port, friends.state
		FROM 	accounts
		JOIN 	friends
		ON 		accounts.id = friends.friendId
		WHERE 	friends.id = :id
	`);
	return query.allEntries({ id }).map((entry): Friend => {
		switch (entry.state) {
			case "sent":
				return {
					username: entry.username,
					status: { type: FriendStatus.SENT },
				};
			case "received":
				return {
					username: entry.username,
					status: { type: FriendStatus.RECEIVED },
				};
			case "friended":
				if (entry.ip === null || entry.port === null) {
					return {
						username: entry.username,
						status: { type: FriendStatus.OFFLINE },
					};
				} else {
					return {
						username: entry.username,
						status: {
							type: FriendStatus.ONLINE,
							ip: entry.ip,
							port: entry.port,
						},
					};
				}
			default:
				throw `state ${entry.state} shouldn't exist in database`;
		}
	});
};
