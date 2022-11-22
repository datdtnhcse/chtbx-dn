/**
 * Data types for working with client-server connections.
 */

export type Request = RegisterRequest | LoginRequest | FriendListRequest;
export type Response = RegisterResponse | LoginResponse | FriendListResponse;
export enum RequestType {
	REGISTER = 0,
	LOGIN = 1,
	FRIEND_LIST = 2,
}
// alias for RequestType, the two are the same
export import ResponseType = RequestType;
export type RequestMap = {
	[K in keyof typeof RequestType]: Request & { //
		type: typeof RequestType[K];
	};
};
export type ResponseMap = {
	[K in keyof typeof ResponseType]: Response & { //
		type: typeof ResponseType[K];
	};
};
export const requestKey = (req: Request) => RequestType[req.type];
export const responseKey = (res: Response) => ResponseType[res.type];

// LOGIN

export type LoginRequest = {
	type: RequestType.LOGIN;
	username: string;
	password: string;
	ip: string;
	port: number;
};

export type LoginResponse = {
	type: ResponseType.LOGIN;
	status: LoginStatus;
};

export enum LoginStatus {
	OK = 0,
	USERNAME_NOT_EXIST = 1,
	WRONG_PASSWORD = 2,
	ALREADY_LOGGED_IN = 3,
}

// REGISTER

export type RegisterRequest = {
	type: RequestType.REGISTER;
	username: string;
	password: string;
};

export type RegisterResponse = {
	type: ResponseType.REGISTER;
	status: RegisterStatus;
};

export enum RegisterStatus {
	OK = 0,
	USERNAME_IS_EXIST = 1,
}

// FRIEND LIST

export type FriendListRequest = {
	type: RequestType.FRIEND_LIST;
};
export type FriendListResponse = {
	type: ResponseType.FRIEND_LIST;
	friends: Friend[];
};
export type Friend = {
	username: string;
	state:
		| { type: FriendStatus }
		| { type: FriendStatus; ip: string; port: number };
};

export enum FriendStatus {
	OFFLINE = 0,
	ONLINE = 1,
}
