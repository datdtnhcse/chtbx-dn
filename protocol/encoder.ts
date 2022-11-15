import { BufWriter } from "std/io/buffer.ts";
import { writerFromStreamWriter } from "std/streams/conversion.ts";
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

export abstract class Encoder<T> {
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

	abstract encode(t: T): void;
}

export class RequestEncoder extends Encoder<Request> {
	encode(req: Request): void {
		if (req.type === RequestType.LOGIN) {
			return this.login(req);
		}
		if (req.type === RequestType.REGISTER) {
			return this.register(req);
		}
	}
	login(req: LoginRequest) {
		this.writer.write(new Uint8Array([RequestType.LOGIN]));
		this.lengthStr(req.username);
		this.lengthStr(req.password);
		this.writer.write(
			new Uint8Array(req.ip.split(".").map(parseInt)),
		);
		this.writer.write(
			new Uint8Array([
				Math.trunc(req.port / Math.pow(2, 8)),
				req.port % Math.pow(2, 8),
			]),
		);
		this.writer.flush();
	}
	register(req: RegisterRequest) {
		this.writer.write(new Uint8Array([RequestType.REGISTER]));
		this.lengthStr(req.username);
		this.lengthStr(req.password);
		this.writer.flush();
	}
}

export class ResponseEncoder extends Encoder<Response> {
	encode(res: Response): void {
		if (res.type === ResponseType.LOGIN) {
			return this.login(res);
		}
		if (res.type === ResponseType.REGISTER) {
			return this.register(res);
		}
	}
	login(res: LoginResponse) {
		this.writer.write(new Uint8Array([ResponseType.LOGIN, res.status]));
		this.writer.flush();
	}
	register(res: RegisterResponse) {
		this.writer.write(new Uint8Array([ResponseType.REGISTER, res.status]));
		this.writer.flush();
	}
}

export class MessageEncoder extends Encoder<Message> {
	encode(msg: Message): void {
		throw "unimplemented";
	}
}
