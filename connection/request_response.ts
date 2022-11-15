import { ResponseDecoder } from "../protocol/decoder.ts";
import { RequestEncoder } from "../protocol/encoder.ts";
import {
	Request,
	Response,
	ResponseType,
} from "../protocol/request_response.ts";

export class TCPRequestResponse {
	#target: EventTarget;
	#controller: AbortController;
	#decoder: ResponseDecoder;
	#encoder: RequestEncoder;
	constructor(serverConn: Deno.Conn) {
		this.#target = new EventTarget();
		this.#controller = new AbortController();
		this.#decoder = new ResponseDecoder(serverConn);
		this.#encoder = new RequestEncoder(serverConn);
	}

	request(req: Request) {
		this.#encoder.encode(req);
	}

	on<T extends keyof typeof ResponseType>(
		type: T,
		listener: (res: Response & { type: typeof ResponseType[T] }) => void,
		options?: { once: boolean },
	) {
		this.#target.addEventListener(type, (ev) => {
			// @ts-ignore: ev is guaranteed to be CustomEvent
			listener(ev.detail);
		}, { ...options, signal: this.#controller.signal });
	}

	#emit(res: Response) {
		this.#target.dispatchEvent(
			new CustomEvent(ResponseType[res.type], { detail: res }),
		);
	}

	async listen() {
		try {
			while (true) {
				const response = await this.#decoder.decode();
				this.#emit(response);
			}
		} catch (e) {
			console.log(e.message);
			this.#controller.abort("EOF");
		}
	}
}
