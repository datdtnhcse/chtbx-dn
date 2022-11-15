import { BufReader } from "std/io/buffer.ts";
import { readerFromStreamReader } from "std/streams/conversion.ts";
import { Message } from "../protocol/message.ts";
import {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
	Request,
	RequestType,
	Response,
	ResponseType,
} from "../protocol/request_response.ts";

export abstract class Decoder<T> {
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

	abstract decode(): Promise<T>;
}

export class RequestDecoder extends Decoder<Request> {
	async decode(): Promise<Request> {
		const type = await this.byte();
		if (isNaN(type)) {
			throw new Error("EOF");
		}

		switch (type) {
			case RequestType.LOGIN:
				return this.login();
			case RequestType.REGISTER:
				return this.register();
		}

		throw new Error(`unreachable type: ${type}`);
	}

	async login(): Promise<LoginRequest> {
		const username = await this.lenStr();
		const password = await this.lenStr();
		const ip: string = [
			await this.byte(),
			await this.byte(),
			await this.byte(),
			await this.byte(),
		].join(".");
		const port: number = (await this.byte()) * Math.pow(2, 8) +
			await this.byte();
		return { type: RequestType.LOGIN, username, password, ip, port };
	}

	async register(): Promise<RegisterRequest> {
		const username = await this.lenStr();
		const password = await this.lenStr();
		return { type: RequestType.REGISTER, username, password };
	}
}

export class ResponseDecoder extends Decoder<Response> {
	async decode(): Promise<Response> {
		const type = await this.byte();
		if (isNaN(type)) {
			throw new Error("EOF");
		}

		switch (type) {
			case RequestType.LOGIN:
				return this.login();
			case RequestType.REGISTER:
				return this.register();
		}

		throw new Error(`unreachable type: ${type}`);
	}

	async login(): Promise<LoginResponse> {
		const status = await this.byte();
		return {
			type: ResponseType.LOGIN,
			status,
		};
	}

	async register(): Promise<RegisterResponse> {
		const status = await this.byte();
		return {
			type: ResponseType.REGISTER,
			status,
		};
	}
}

export class MessageDecoder extends Decoder<Message> {
	decode(): Promise<Message> {
		throw "unimplemented";
	}
}
