/**
 * Data types for working with webapp-client-server connection
 */

import { LoginStatus, RegisterStatus } from "./request_response.ts";

export type Action = LoginAction | RegisterAction | SyncAction;
export type Result = LoginResult | RegisterResult | SyncResult;
export enum ActionType {
	LOGIN = 0,
	REGISTER = 1,
	SYNC = 2,
}
export enum ResultType {
	LOGIN = 0,
	REGISTER = 1,
	SYNC = 2,
}

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
	state: State;
};

export type State = {
	username: string | null;
};
