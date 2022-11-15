import { Action, Result, ResultType } from "../protocol/action_result.ts";

export class WebSocketActionResult {
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

	async act(action: Action) {
		await this.#ready;
		this.#socket.send(JSON.stringify(action));
	}

	on<T extends keyof typeof ResultType>(
		type: T,
		listener: (res: Result & { type: typeof ResultType[T] }) => void,
		options?: { once: boolean },
	) {
		this.#target.addEventListener(type, (ev) => {
			// @ts-ignore: ev is guaranteed to be CustomEvent
			listener(ev.detail);
		}, { ...options, signal: this.#controller.signal });
	}

	#emit(res: Result) {
		this.#target.dispatchEvent(
			new CustomEvent(ResultType[res.type], { detail: res }),
		);
	}

	async listen() {
		return await new Promise<void>((resolve) => {
			this.#socket.addEventListener("open", (_) => {
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
