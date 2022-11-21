import { RequestDecoder } from "../protocol/decoder.ts";
import { ResponseEncoder } from "../protocol/encoder.ts";
import {
	Request,
	RequestType,
	Response,
} from "../protocol/request_response.ts";

export class TCPResponseRequest {
	#target: EventTarget;
	#controller: AbortController;
	#decoder: RequestDecoder;
	#encoder: ResponseEncoder;

	constructor(clientConn: Deno.Conn) {
		this.#target = new EventTarget();
		this.#controller = new AbortController();
		this.#decoder = new RequestDecoder(clientConn);
		this.#encoder = new ResponseEncoder(clientConn);
	}

	respond(res: Response) {
		this.#encoder.encode(res);
	}

	on<T extends keyof typeof RequestType>(
		type: T,
		listener: (req: Request & { type: typeof RequestType[T] }) => void,
		options?: { once: boolean },
	) {
		this.#target.addEventListener(type, (ev) => {
			// @ts-ignore: ev is guaranteed to be CustomEvent
			listener(ev.detail);
		}, { ...options, signal: this.#controller.signal });
	}

	#emit(req: Request) {
		this.#target.dispatchEvent(
			new CustomEvent(RequestType[req.type], { detail: req }),
		);
	}

	async listen() {
		try {
			while (true) {
				const request = await this.#decoder.decode();
				this.#emit(request);
			}
		} catch (e) {
			console.log(e.message);
			this.#controller.abort("EOF");
		}
	}
}
