import { BufReader, BufWriter } from "std/io/buffer.ts";
import {
	readerFromStreamReader,
	writerFromStreamWriter,
} from "std/streams/conversion.ts";

export type Request = RegisterRequest | LoginRequest;
export type Response = RegisterResponse | LoginResponse;

export interface RegisterRequest {
	type: "register";
	username: string;
	password: string;
}

export interface RegisterResponse {
	type: "register";
	ok: boolean;
	message?: "username exists";
}

export interface LoginRequest {
	type: "login";
	username: string;
	password: string;
}

export interface LoginResponse {
	type: "login";
	status: keyof typeof LoginStatus;
}

export enum RequestType {
	LOGIN = 0,
}

// alias for RequestType, the two are the same
export import ResponseType = RequestType;

export enum LoginStatus {
	OK = 0,
	USERNAME_NOT_EXIST = 1,
	WRONG_PASSWORD = 2,
	ALREADY_LOGGED_IN = 3,
}

class Decoder {
	reader: BufReader;
	constructor(conn: Deno.Conn) {
		this.reader = BufReader.create(
			readerFromStreamReader(conn.readable.getReader()),
		);
	}

	async byte() {
		return await this.reader.readByte() ?? NaN;
	}

	// read a string prefixed by its length
	async lenStr() {
		const len = await this.byte();
		const buf = new Uint8Array(len);
		await this.reader.readFull(buf);
		return new TextDecoder().decode(buf);
	}

	// read a null-terminated string
	async nullStr() {
		return (await this.reader.readString("\0"))!;
	}
}

export class RequestDecoder extends Decoder {
	async decode(): Promise<Request> {
		const type = await this.byte();
		if (isNaN(type)) {
			throw new Error("EOF");
		}

		switch (type) {
			case RequestType.LOGIN:
				return this.login();
		}

		throw new Error(`unreachable type: ${type}`);
	}

	async login(): Promise<LoginRequest> {
		const username = await this.lenStr();
		const password = await this.lenStr();
		return { type: "login", username, password };
	}
}

export class ResponseDecoder extends Decoder {
	async login(): Promise<LoginResponse> {
		const status = await this.byte();
		return {
			type: "login",
			status: LoginStatus[status] as keyof typeof LoginStatus,
		};
	}
}

export class Encoder {
	writer: BufWriter;
	constructor(conn: Deno.Conn) {
		this.writer = BufWriter.create(
			writerFromStreamWriter(conn.writable.getWriter()),
		);
	}

	lengthStr(s: string) {
		if (s.length > 255) {
			throw Error(`string has more than 255 byte: ${s}`);
		}
		this.writer.write(
			new Uint8Array([s.length, ...new TextEncoder().encode(s)]),
		);
	}

	nullStr(s: string) {
		this.writer.write(
			new Uint8Array([...new TextEncoder().encode(s), 0]),
		);
	}
}

export class RequestEncoder extends Encoder {
	login(username: string, password: string) {
		this.writer.write(new Uint8Array([RequestType.LOGIN]));
		this.lengthStr(username);
		this.lengthStr(password);
		this.writer.flush();
	}
}

export class ResponseEncoder extends Encoder {
	login(
		status: LoginStatus,
	) {
		this.writer.write(new Uint8Array([RequestType.LOGIN, status]));
		this.writer.flush();
	}
}
