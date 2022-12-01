/**
 * Data types for working with webapp-client-server connection
 */
import {
	AddFriendStatus,
	Friend,
	LoginStatus,
	RegisterStatus,
} from "./request_response.ts";

export type Action =
	| LoginAction
	| LogoutAction
	| RegisterAction
	| SyncAction
	| ConnectAction
	| HelloAction
	| MessageAction
	| AddFriendAction
	| FileOfferAction
	| FileRequestAction
	| FileSendAction;
export type Result =
	| LoginResult
	| RegisterResult
	| SyncResult
	| ConnectResult
	| HelloResult
	| MessageResult
	| AddFriendResult
	| FileRequestResult
	| FileSendResult;

export enum ActionType {
	REGISTER = 0,
	LOGIN = 1,
	SYNC = 2,
	CONNECT = 3,
	HELLO = 4,
	SEND_MESSAGE = 5,
	ADD_FRIEND = 6,
	LOGOUT = 7,
	FILE_OFFER = 8,
	FILE_REQUEST = 9,
	FILE_SEND = 10,
}
export enum ResultType {
	REGISTER = 0,
	LOGIN = 1,
	SYNC = 2,
	CONNECT = 3,
	HELLO = 4,
	SEND_MESSAGE = 5,
	ADD_FRIEND = 6,
	FILE_REQUEST = 7,
	FILE_SEND = 8,
}
export type ActionMap = {
	[K in keyof typeof ActionType]: Action & { //
		type: typeof ActionType[K];
	};
};
export type ResultMap = {
	[K in keyof typeof ResultType]: Result & { //
		type: typeof ResultType[K];
	};
};
export const actionKey = (act: Action) => ActionType[act.type];
export const resultKey = (res: Result) => ResultType[res.type];

export type LogoutAction = {
	type: ActionType.LOGOUT;
};
export type LoginAction = {
	type: ActionType.LOGIN;
	username: string;
	password: string;
};
export type LoginResult = {
	type: ResultType.LOGIN;
	status: LoginStatus;
};

export type RegisterAction = {
	type: ActionType.REGISTER;
	username: string;
	password: string;
};
export type RegisterResult = {
	type: ResultType.REGISTER;
	status: RegisterStatus;
};
export type SyncAction = {
	type: ActionType.SYNC;
};
export type SyncResult = {
	type: ResultType.SYNC;
	state: GUIState;
};

export type GUIState = {
	username: string | null;
	friends: Friend[];
	dialogs: Map<
		string,
		({ type: "content"; author: string; content: string })[]
	>;
	connecteds: Set<string>; // usernames
	offeredFile: { name: string; size: number } | null;
};

export type ConnectAction = {
	type: ActionType.CONNECT;
	username: string;
};
export type ConnectResult = {
	type: ResultType.CONNECT;
	username: string;
};

export type HelloAction = {
	type: ActionType.HELLO;
	username: string;
};
export type HelloResult = {
	type: ResultType.HELLO;
	username: string;
};
export type MessageAction = {
	type: ActionType.SEND_MESSAGE;
	content: string;
};
export type MessageResult = {
	type: ResultType.SEND_MESSAGE;
	content: string;
};
export type AddFriendAction = {
	type: ActionType.ADD_FRIEND;
	username: string;
};
export type AddFriendResult = {
	type: ResultType.ADD_FRIEND;
	status: AddFriendStatus;
};

export type FileOfferAction = {
	type: ActionType.FILE_OFFER;
	name: string;
	size: number;
};

export type FileRequestAction = {
	type: ActionType.FILE_REQUEST;
};

export type FileRequestResult = {
	type: ResultType.FILE_REQUEST;
};

export type FileSendAction = {
	type: ActionType.FILE_SEND;
	chunk: Uint8Array;
};

export type FileSendResult = {
	type: ResultType.FILE_SEND;
};
