/**
 * Data types for working with client-to-client connections.
 */

export type Message = SendMessageMessage | HelloMessage;
export enum MessageType {
	HELLO = 0,
	SEND_MESSAGE = 1,
}

export type SendMessageMessage = {
	type: MessageType.SEND_MESSAGE;
	content: string;
};

export type HelloMessage = {
	type: MessageType.HELLO;
	username: string;
};
