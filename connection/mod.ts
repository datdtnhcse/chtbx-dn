export abstract class Connection<SendMap, ReceiveMap> {
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
