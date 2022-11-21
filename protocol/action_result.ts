/**
 * Data types for working with webapp-client-server connection
 */

import { Friend, LoginStatus, RegisterStatus } from "./request_response.ts";

export type Action =
	| LoginAction
	| RegisterAction
	| SyncAction
	| ConnectAction
	| HelloAction
	| SendMessageAction;
export type Result =
	| LoginResult
	| RegisterResult
	| SyncResult
	| ConnectResult
	| HelloResult;

export enum ActionType {
	REGISTER = 0,
	LOGIN = 1,
	SYNC = 2,
	CONNECT = 3,
	HELLO = 4,
	SEND_MESSAGE = 5,
}
export enum ResultType {
	REGISTER = 0,
	LOGIN = 1,
	SYNC = 2,
	CONNECT = 3,
	HELLO = 4,
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

export type SendMessageAction = {
	type: ActionType.SEND_MESSAGE;
	message: string;
};
