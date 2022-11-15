import { Action, ActionType, Result } from "../protocol/action_result.ts";

export class WebSocketResultAction {
	#target: EventTarget;
	#controller: AbortController;
	#socket: WebSocket;
	#resolve: () => void = () => {};
	#ready: Promise<void> = new Promise((resolve) => this.#resolve = resolve);

	constructor(socket: WebSocket) {
		this.#target = new EventTarget();
		this.#controller = new AbortController();
		this.#socket = socket;
	}

	async result(res: Result) {
		await this.#ready;
		this.#socket.send(JSON.stringify(res));
	}

	on<T extends keyof typeof ActionType>(
		type: T,
		listener: (act: Action & { type: typeof ActionType[T] }) => void,
		options?: { once: boolean },
	) {
		this.#target.addEventListener(type, (ev) => {
			// @ts-ignore: ev is guaranteed to be CustomEvent
			listener(ev.detail);
		}, { ...options, signal: this.#controller.signal });
	}

	#emit(act: Action) {
		this.#target.dispatchEvent(
			new CustomEvent(ActionType[act.type], { detail: act }),
		);
	}

	async listen() {
		return await new Promise<void>((resolve) => {
			this.#socket.addEventListener("open", (_) => {
				console.log("connection ready");
				this.#resolve();
			});
			this.#socket.addEventListener("message", (e) => {
				this.#emit(JSON.parse(e.data));
			}, { signal: this.#controller.signal });

			// on closing, remove all the listener and return from promise
			this.#socket.addEventListener("close", () => {
				this.#controller.abort();
				resolve();
			}, { signal: this.#controller.signal });
		});
	}
}
