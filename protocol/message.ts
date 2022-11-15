/**
 * Data types for working with client-to-client connections.
 */

export type Message = SendMessageMessage;
export enum MessageType {
	SEND_MESSAGE = 0,
}

export type SendMessageMessage = {
	type: MessageType.SEND_MESSAGE;
	content: string;
};
