import { BufWriter } from "std/io/buffer.ts";
import { writerFromStreamWriter } from "std/streams/conversion.ts";
import { LoginStatus, RegisterStatus, RequestType, ResponseType } from "./message.ts";

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
	register(username: string, password: string) {
		this.writer.write(new Uint8Array([RequestType.REGISTER]));
		this.lengthStr(username);
		this.lengthStr(password);
		this.writer.flush();
	}
}

export class ResponseEncoder extends Encoder {
	login(
		status: LoginStatus,
	) {
		this.writer.write(new Uint8Array([ResponseType.LOGIN, status]));
		this.writer.flush();
	}
	register(
		status: RegisterStatus,
	) {
		this.writer.write(new Uint8Array([ResponseType.REGISTER, status]));
		this.writer.flush();
	}
}

export class MessageEncoder extends Encoder {
}
