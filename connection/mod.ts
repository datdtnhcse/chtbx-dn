import { Decoder } from "../protocol/decoder.ts";
import { Encoder } from "../protocol/encoder.ts";

abstract class Connection<SendMap, ReceiveMap> {
	private target: EventTarget;
	private getKey: (data: ReceiveMap[keyof ReceiveMap]) => string;
	protected controller: AbortController;

	constructor(
		getKey: (key: ReceiveMap[keyof ReceiveMap]) => string,
	) {
		this.target = new EventTarget();
		this.controller = new AbortController();
		this.getKey = getKey;
	}

	protected abort() {
		this.controller.abort();
	}

	protected emit(input: ReceiveMap[keyof ReceiveMap]) {
		this.target.dispatchEvent(
			new CustomEvent(this.getKey(input), { detail: input }),
		);
	}

	on<K extends keyof ReceiveMap>(
		type: K,
		listener: (req: ReceiveMap[K]) => void,
		options?: { once: boolean },
	) {
		this.target.addEventListener(type.toString(), (ev) => {
			// @ts-ignore: ev is guaranteed to be CustomEvent
			listener(ev.detail);
		}, { ...options, signal: this.controller.signal });
	}

	abstract send(data: SendMap[keyof SendMap]): void;
	abstract listen(): Promise<void>;
}

export class TCPConnection<SendMap, ReceiveMap>
	extends Connection<SendMap, ReceiveMap> {
	private decoder: Decoder<ReceiveMap[keyof ReceiveMap]>;
	private encoder: Encoder<SendMap[keyof SendMap]>;

	constructor(
		clientConn: Deno.Conn,
		Encoder: { new (conn: Deno.Conn): Encoder<SendMap[keyof SendMap]> }, // deno-fmt-ignore
		Decoder: { new (conn: Deno.Conn): Decoder<ReceiveMap[keyof ReceiveMap]> }, // deno-fmt-ignore
		getKey: (key: ReceiveMap[keyof ReceiveMap]) => string,
	) {
		super(getKey);
		this.decoder = new Decoder(clientConn);
		this.encoder = new Encoder(clientConn);
	}

	send(data: SendMap[keyof SendMap]) {
		this.encoder.encode(data);
	}

	async listen() {
		try {
			while (true) {
				const request = await this.decoder.decode();
				this.emit(request);
			}
		} catch (e) {
			console.log(e.message);
			this.abort();
		}
	}
}

export class WebSocketConnection<SendMap, ReceiveMap>
	extends Connection<SendMap, ReceiveMap> {
	private socket: WebSocket;

	// wait for socket ready state
	private resolve: () => void = () => {};
	private ready: Promise<void> = new Promise((resolve) =>
		this.resolve = resolve
	);

	constructor(
		socket: WebSocket,
		getKey: (data: ReceiveMap[keyof ReceiveMap]) => string,
	) {
		super(getKey);
		this.socket = socket;
	}

	async send(data: SendMap[keyof SendMap]) {
		await this.ready;
		this.socket.send(JSON.stringify(data));
	}

	async listen() {
		return await new Promise<void>((resolve) => {
			this.socket.addEventListener("open", (_) => {
				console.log("connection ready");
				this.resolve();
			});
			this.socket.addEventListener("message", (e) => {
				this.emit(JSON.parse(e.data));
			}, { signal: this.controller.signal });

			// on closing, remove all the listener and return from promise
			this.socket.addEventListener("close", () => {
				this.controller.abort();
				resolve();
			}, { signal: this.controller.signal });
		});
	}
}
