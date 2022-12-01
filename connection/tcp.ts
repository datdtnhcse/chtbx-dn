import { Mutex } from "https://deno.land/x/semaphore@v1.1.2/mod.ts";
import { Decoder } from "../protocol/decoder.ts";
import { Encoder } from "../protocol/encoder.ts";
import { Connection } from "./mod.ts";

export class TCPConnection<SendMap, ReceiveMap>
	extends Connection<SendMap, ReceiveMap> {
	private conn: Deno.Conn;
	private readLock = new Mutex();
	private writeLock = new Mutex();
	private decoder: Decoder<ReceiveMap[keyof ReceiveMap]>;
	private encoder: Encoder<SendMap[keyof SendMap]>;

	constructor(
		clientConn: Deno.Conn,
		Encoder: { new (conn: Deno.Conn): Encoder<SendMap[keyof SendMap]> }, // deno-fmt-ignore
		Decoder: { new (conn: Deno.Conn): Decoder<ReceiveMap[keyof ReceiveMap]> }, // deno-fmt-ignore
		sendKey: (data: SendMap[keyof SendMap]) => string,
		receiveKey: (data: ReceiveMap[keyof ReceiveMap]) => string,
		label: string,
	) {
		super(sendKey, receiveKey, label);
		this.conn = clientConn;
		this.decoder = new Decoder(clientConn);
		this.encoder = new Encoder(clientConn);
		this.listen();
	}

	async send(data: SendMap[keyof SendMap]) {
		console.log(this.label, "sent", this.sendKey(data), data);
		const release = await this.readLock.acquire();
		try {
			await this.encoder.encode(data);
		} finally {
			release();
		}
	}

	protected async listen() {
		try {
			while (true) {
				const release = await this.writeLock.acquire();
				try {
					const request = await this.decoder.decode();
					this.emit(request);
				} finally {
					release();
				}
			}
		} catch (e) {
			console.log(e);
			try {
				this.conn.close();
			} catch {
				// try close...
			}
			this.abort();
		}
	}

	disconnect() {
		try {
			this.conn.close();
		} catch {
			// if already closed, then nah
		}
	}
}
