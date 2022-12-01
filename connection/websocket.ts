import superjson from "https://esm.sh/superjson@1.11.0";
import { Connection } from "./mod.ts";

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
