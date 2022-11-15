import { MessageDecoder } from "../protocol/decoder.ts";
import { MessageEncoder } from "../protocol/encoder.ts";
import { Message, MessageType } from "../protocol/message.ts";

export class TCPMessageMessage {
	#target: EventTarget;
	#controller: AbortController;
	#decoder: MessageDecoder;
	#encoder: MessageEncoder;
	constructor(serverConn: Deno.Conn) {
		this.#target = new EventTarget();
		this.#controller = new AbortController();
		this.#decoder = new MessageDecoder(serverConn);
		this.#encoder = new MessageEncoder(serverConn);
	}

	message(msg: Message) {
		this.#encoder.encode(msg);
	}

	on<T extends keyof typeof MessageType>(
		type: T,
		listener: (msg: Message & { type: typeof MessageType[T] }) => void,
		options?: { once: boolean },
	) {
		this.#target.addEventListener(type, (ev) => {
			// @ts-ignore: ev is guaranteed to be CustomEvent
			listener(ev.detail);
		}, { ...options, signal: this.#controller.signal });
	}

	#emit(msg: Message) {
		this.#target.dispatchEvent(
			new CustomEvent(MessageType[msg.type], { detail: msg }),
		);
	}

	async listen() {
		try {
			while (true) {
				const msg = await this.#decoder.decode();
				this.#emit(msg);
			}
		} catch (e) {
			console.log(e.message);
			this.#controller.abort("EOF");
		}
	}
}
