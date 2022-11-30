import superjson from "https://esm.sh/superjson@1.11.0";
import { Decoder } from "../protocol/decoder.ts";
import { Encoder } from "../protocol/encoder.ts";

abstract class Connection<SendMap, ReceiveMap> {
	label: string;
	private target: EventTarget;
	private receiveKey: (data: ReceiveMap[keyof ReceiveMap]) => string;
	protected sendKey: (data: SendMap[keyof SendMap]) => string;
	readonly controller: AbortController;

	constructor(
		sendKey: (key: SendMap[keyof SendMap]) => string,
		receiveKey: (key: ReceiveMap[keyof ReceiveMap]) => string,
		label: string,
	) {
		this.target = new EventTarget();
		this.controller = new AbortController();
		this.sendKey = sendKey;
		this.receiveKey = receiveKey;
		this.label = label;
	}

	protected abort() {
		this.controller.abort();
	}

	onDisconnect(
		handler: () => unknown,
		options?: { signal?: AbortSignal },
	) {
		this.controller.signal.addEventListener("abort", handler, {
			once: true,
			signal: options?.signal,
		});
	}

	protected emit(input: ReceiveMap[keyof ReceiveMap]) {
		const type = this.receiveKey(input);
		this.target.dispatchEvent(
			new CustomEvent(type, { detail: input }),
		);
	}

	on<K extends keyof ReceiveMap>(
		type: K,
		listener: (req: ReceiveMap[K]) => void,
		options?: { once?: boolean; signal?: AbortSignal },
	) {
		this.target.addEventListener(type.toString(), (ev) => {
			if (ev instanceof CustomEvent) {
				console.log(this.label, "recv", type, ev.detail);
				listener(ev.detail);
			}
		}, {
			...options,
			signal: anySignals(
				[this.controller.signal, options?.signal].filter(
					Boolean,
				) as AbortSignal[],
			),
		});
	}

	wait<K extends keyof ReceiveMap>(
		type: K,
	): Promise<ReceiveMap[K]> {
		return new Promise((resolve) => {
			this.on(type, resolve, { once: true });
		});
	}

	abstract send(data: SendMap[keyof SendMap]): void;
	abstract disconnect(): void;
	protected abstract listen(): Promise<void>;
}

export class TCPConnection<SendMap, ReceiveMap>
	extends Connection<SendMap, ReceiveMap> {
	private conn: Deno.Conn;
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

	send(data: SendMap[keyof SendMap]) {
		console.log(this.label, "sent", this.sendKey(data), data);
		this.encoder.encode(data);
	}

	protected async listen() {
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

	disconnect() {
		this.conn.close();
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
		sendKey: (data: SendMap[keyof SendMap]) => string,
		receiveKey: (data: ReceiveMap[keyof ReceiveMap]) => string,
		label: string,
	) {
		super(sendKey, receiveKey, label);
		this.socket = socket;
		this.listen();
	}

	async send(data: SendMap[keyof SendMap]) {
		await this.ready;
		console.log(this.label, "sent", this.sendKey(data), data);
		this.socket.send(superjson.stringify(data));
	}

	protected async listen() {
		return await new Promise<void>((resolve) => {
			this.socket.addEventListener("open", (_) => {
				this.resolve();
			});
			this.socket.addEventListener("message", (e) => {
				this.emit(superjson.parse(e.data));
			}, { signal: this.controller.signal });

			// on closing, remove all the listener and return from promise
			this.socket.addEventListener("close", () => {
				this.controller.abort();
				resolve();
			}, { signal: this.controller.signal });
		});
	}

	disconnect() {
		this.socket.close();
	}
}

function anySignals(signals: AbortSignal[]) {
	const controller = new AbortController();

	function onAbort() {
		controller.abort();
		for (const signal of signals) {
			signal.removeEventListener("abort", onAbort);
		}
	}

	for (const signal of signals) {
		if (signal.aborted) {
			onAbort();
			break;
		}
		signal.addEventListener("abort", onAbort);
	}

	return controller.signal;
}
