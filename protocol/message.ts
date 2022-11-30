/**
 * Data types for working with client-to-client connections.
 */

export type Message =
	| SendMessageMessage
	| HelloMessage
	| FileOfferMessage
	| FileRequestMessage
	| FileSendMessage;
export enum MessageType {
	HELLO = 0,
	SEND_MESSAGE = 1,
	FILE_OFFER = 2,
	FILE_REQUEST = 3,
	FILE_SEND = 4,
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
	fileId: number;
};

export type FileRequestMessage = {
	type: MessageType.FILE_REQUEST;
	fileId: number;
};

export type FileSendMessage = {
	type: MessageType.FILE_SEND;
	status: {
		type: FileStatus.OK;
		size: number;
		// content is streamed after this
	} | { type: FileStatus.FILE_NOT_AVAILABLE };
};
export enum FileStatus {
	OK = 0,
	FILE_NOT_AVAILABLE = 1,
}

export type HelloMessage = {
	type: MessageType.HELLO;
	username: string;
};
