export type Request = RegisterRequest | LoginRequest;
export type Response = RegisterResponse | LoginResponse;
export type Message = SendMessageMessage;

export interface RegisterRequest {
	type: RequestType.REGISTER;
	username: string;
	password: string;
}

export interface RegisterResponse {
	type: ResponseType.REGISTER;
	status: RegisterStatus;
}

export interface LoginRequest {
	type: RequestType.LOGIN;
	username: string;
	password: string;
}

export interface LoginResponse {
	type: ResponseType.LOGIN;
	status: LoginStatus;
}

export enum RequestType {
	LOGIN = 0,
	REGISTER = 1,
}

// alias for RequestType, the two are the same
export import ResponseType = RequestType;

export enum LoginStatus {
	OK = 0,
	USERNAME_NOT_EXIST = 1,
	WRONG_PASSWORD = 2,
	ALREADY_LOGGED_IN = 3,
}
export enum RegisterStatus {
	OK = 0,
	USERNAME_IS_EXIST = 1,
}

export interface SendMessageMessage {
	type: MessageType.SEND_MESSAGE;
	content: string;
}

export enum MessageType {
	SEND_MESSAGE = 0,
}
