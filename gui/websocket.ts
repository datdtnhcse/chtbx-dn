import { signal } from "https://esm.sh/v96/@preact/signals-core@1.2.2/dist/signals-core.d.ts";
import {
	LoginRequest,
	LoginResponse,
	Message,
	RegisterRequest,
	RegisterResponse,
} from "../message.ts";

class ClientServerSocket {
	initializing = signal(true);
	username = signal("");
	socket: WebSocket;

	constructor(url: string) {
		this.socket = new WebSocket(url);
		this.socket.addEventListener("message", (e) => {
			const data = JSON.parse(e.data);
			console.log("Initiate", data);
			this.initializing.value = false;
			this.username.value = data.username;
		}, { once: true });
	}

	request(req: LoginRequest): Promise<LoginResponse>;
	request(req: RegisterRequest): Promise<RegisterResponse>;
	async request(req: unknown) {
		return await new Promise((resolve) => {
			this.socket.send(JSON.stringify(req));
			this.socket.addEventListener("message", (e) => {
				resolve(JSON.parse(e.data));
			}, { once: true });
		});
	}
}

export class P2PSocket {
	socket: WebSocket;
	constructor(ip: string) {
		this.socket = new WebSocket(ip, "p2p.chtbx.com");
	}
	send(message: Message) {
		this.socket.send(JSON.stringify(message));
	}
	receive(onMessage: (m: Message) => unknown) {
		this.socket.addEventListener("message", (e) => {
			onMessage(JSON.parse(e.data));
		});
	}
}

const url = new URL(window.location.toString());
url.protocol = "ws";
url.pathname = "";
export const clientServerSocket = new ClientServerSocket(url.toString());
