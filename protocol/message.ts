/**
 * Data types for working with client-to-client connections.
 */

export type Message =
	| SendMessageMessage
	| HelloMessage
	| FileOfferMessage
	| FileRequestMessage
	| FileSendMessage
	| FileRevokeMessage;
export enum MessageType {
	HELLO = 0,
	SEND_MESSAGE = 1,
	FILE_OFFER = 2,
	FILE_REQUEST = 3,
	FILE_SEND = 4,
	FILE_REVOKE = 5,
}
export type MessageMap = {
	[K in keyof typeof MessageType]: Message & { //
		type: typeof MessageType[K];
	};
};
export const messageKey = (mes: Message) => MessageType[mes.type];

export type SendMessageMessage = {
	type: MessageType.SEND_MESSAGE;
	content: string;
};

export type FileOfferMessage = {
	type: MessageType.FILE_OFFER;
	name: string;
	size: number;
};

export type FileRevokeMessage = {
	type: MessageType.FILE_REVOKE;
};

export type FileRequestMessage = {
	type: MessageType.FILE_REQUEST;
};

export type FileSendMessage = {
	type: MessageType.FILE_SEND;
	chunk: Uint8Array;
};

export type HelloMessage = {
	type: MessageType.HELLO;
	username: string;
};
