import { BufWriter } from "std/io/buffer.ts";
import { writerFromStreamWriter } from "std/streams/conversion.ts";
import {
	FileOfferMessage,
	FileRequestMessage,
	FileRevokeMessage,
	FileSendMessage,
	HelloMessage,
	Message,
	MessageType,
	SendMessageMessage,
} from "../protocol/message.ts";
import {
	AddFriendRequest,
	AddFriendResponse,
	FriendListRequest,
	FriendListResponse,
	FriendStatus,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
	Request,
	RequestType,
	Response,
	ResponseType,
} from "../protocol/request_response.ts";

export abstract class Encoder<T> {
	writer: BufWriter;
	constructor(conn: Deno.Conn) {
		this.writer = BufWriter.create(
			writerFromStreamWriter(conn.writable.getWriter()),
		);
	}

	async ip(ip: string) {
		const parts = ip.split(".").map(Number);
		if (parts.some((part) => isNaN(part) || part > 255)) {
			throw new Error(`invalid ip format: ${ip}`);
		}
		await this.writer.write(new Uint8Array(parts));
	}

	async byte(i: number) {
		if (i >= Math.pow(2, 8)) {
			throw Error(`num bigger than 1 bytes: ${i}`);
		}
		await this.writer.write(new Uint8Array([i]));
	}
	async twoBytes(m: number) {
		if (m >= Math.pow(2, 16)) {
			throw Error(`num bigger than 2 bytes: ${m}`);
		}
		const arr = new ArrayBuffer(2);
		new DataView(arr).setUint16(0, m);
		await this.writer.write(new Uint8Array(arr));
	}
	async fourBytes(m: number) {
		if (m >= Math.pow(2, 32)) {
			throw Error(`num bigger than 4 bytes: ${m}`);
		}
		const arr = new ArrayBuffer(4);
		new DataView(arr).setUint32(0, m);
		await this.writer.write(new Uint8Array(arr));
	}

	async lengthStr(s: string) {
		if (s.length > 255) {
			throw Error(`string has more than 255 byte: ${s}`);
		}
		await this.writer.write(
			new Uint8Array([s.length, ...new TextEncoder().encode(s)]),
		);
	}

	async nullStr(s: string) {
		await this.writer.write(
			new Uint8Array([...new TextEncoder().encode(s), 0]),
		);
	}
	abstract encode(t: T): void;
}

export class RequestEncoder extends Encoder<Request> {
	async encode(req: Request) {
		switch (req.type) {
			case RequestType.LOGIN:
				return await this.login(req);
			case RequestType.REGISTER:
				return await this.register(req);
			case RequestType.FRIEND_LIST:
				return await this.friendList(req);
			case RequestType.ADD_FRIEND:
				return await this.addFriend(req);
				// default:
				// 	throw `unreachable req type ${req.type}`;
		}
	}
	async login(req: LoginRequest) {
		await this.byte(RequestType.LOGIN);
		await this.lengthStr(req.username);
		await this.lengthStr(req.password);
		await this.ip(req.ip);
		await this.twoBytes(req.port);
		await this.writer.flush();
	}
	async register(req: RegisterRequest) {
		await this.byte(RequestType.REGISTER);
		await this.lengthStr(req.username);
		await this.lengthStr(req.password);
		await this.writer.flush();
	}
	async addFriend(req: AddFriendRequest) {
		await this.byte(RequestType.ADD_FRIEND);
		await this.lengthStr(req.username);
		await this.writer.flush();
	}
	async friendList(_: FriendListRequest) {
		await this.byte(RequestType.FRIEND_LIST);
		await this.writer.flush();
	}
}

export class ResponseEncoder extends Encoder<Response> {
	async encode(res: Response) {
		switch (res.type) {
			case ResponseType.LOGIN:
				return await this.login(res);
			case ResponseType.REGISTER:
				return await this.register(res);
			case ResponseType.FRIEND_LIST:
				return await this.friendList(res);
			case ResponseType.ADD_FRIEND:
				return await this.addFriend(res);
		}
	}
	async login(res: LoginResponse) {
		await this.byte(ResponseType.LOGIN);
		await this.byte(res.status);
		await this.writer.flush();
	}
	async register(res: RegisterResponse) {
		await this.byte(ResponseType.REGISTER);
		await this.byte(res.status);
		await this.writer.flush();
	}
	async addFriend(res: AddFriendResponse) {
		await this.byte(ResponseType.ADD_FRIEND);
		await this.byte(res.status);
		await this.writer.flush();
	}
	async friendList(res: FriendListResponse) {
		await this.byte(ResponseType.FRIEND_LIST);
		await this.twoBytes(res.friends.length);
		for (const friend of res.friends) {
			await this.lengthStr(friend.username);
			await this.byte(friend.status.type);
			if (friend.status.type == FriendStatus.ONLINE) {
				await this.ip(friend.status.ip);
				await this.twoBytes(friend.status.port);
			}
		}
		await this.writer.flush();
	}
}

export class MessageEncoder extends Encoder<Message> {
	async encode(msg: Message) {
		this.byte(msg.type);
		switch (msg.type) {
			case MessageType.SEND_MESSAGE:
				return await this.sendMessage(msg);
			case MessageType.HELLO:
				return await this.hello(msg);
			case MessageType.FILE_OFFER:
				return await this.fileOffer(msg);
			case MessageType.FILE_REQUEST:
				return await this.fileRequest(msg);
			case MessageType.FILE_SEND:
				return await this.fileSend(msg);
			case MessageType.FILE_REVOKE:
				return await this.fileRevoke(msg);
			default:
				throw "unimplemented";
		}
	}
	async sendMessage(msg: SendMessageMessage) {
		await this.nullStr(msg.content);
		await this.writer.flush();
	}
	async hello(msg: HelloMessage) {
		await this.lengthStr(msg.username);
		await this.writer.flush();
	}
	async fileOffer(msg: FileOfferMessage) {
		await this.nullStr(msg.name);
		await this.fourBytes(msg.size);
		await this.writer.flush();
	}
	async fileRequest(_: FileRequestMessage) {
		await this.writer.flush();
	}
	async fileRevoke(_: FileRevokeMessage) {
		await this.writer.flush();
	}
	async fileSend(msg: FileSendMessage) {
		await this.fourBytes(msg.chunk.byteLength);
		await this.writer.write(msg.chunk);
		await this.writer.flush();
	}
}
