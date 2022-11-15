import "dotenv/load";
import { serve } from "std/http/server.ts";
import {
	LoginRequest,
	LoginStatus,
	Message,
	MessageDecoder,
	MessageEncoder,
	MessageType,
	RegisterRequest,
	Request,
	RequestEncoder,
	RequestType,
	ResponseDecoder,
	ResponseType,
	SendMessageMessage,
} from "../message.ts";
import { port as esbuildPort } from "./esbuild.ts";

const serverConn = await Deno.connect({
	hostname: Deno.env.get("SERVER_HOST")!,
	port: parseInt(Deno.env.get("SERVER_PORT")!),
});
console.log(
	"Connect server",
	serverConn.remoteAddr,
);

// state of server connection
let username: string | null = null;

class ClientServerSocket {
	decoder: ResponseDecoder;
	encoder: RequestEncoder;
	socket: WebSocket;

	static decoder = new ResponseDecoder(serverConn);
	static encoder = new RequestEncoder(serverConn);

	static async init(socket: WebSocket) {
		return await new Promise((resolve) => {
			// on initialization, send the current state
			// to sync with the GUI state
			socket.addEventListener("open", () => {
				socket.send(JSON.stringify({ username }));
			}, { once: true });

			resolve(new ClientServerSocket(socket));
		});
	}

	constructor(socket: WebSocket) {
		this.socket = socket;
		this.decoder = ClientServerSocket.decoder;
		this.encoder = ClientServerSocket.encoder;

		socket.addEventListener("message", (e) => {
			this.handle(JSON.parse(e.data));
		});
	}

	handle(req: Request) {
		if (req.type == RequestType.LOGIN) {
			return this.login(req);
		}
		if (req.type == RequestType.REGISTER) {
			return this.register(req);
		}
		throw new Error("unreachable");
	}

	async login(req: LoginRequest) {
		this.encoder.login(req.username, req.password);
		const res = await this.decoder.decode();
		if (res.type !== RequestType.LOGIN) throw "unreachable";

		console.log("login status", LoginStatus[res.status]);
		this.socket.send(JSON.stringify(res));

		if (res.status == LoginStatus.OK) {
			username = req.username;
		}
	}

	async register(req: RegisterRequest) {
		this.encoder.register(req.username, req.password);
		const res = await this.decoder.decode();
		if (res.type !== ResponseType.REGISTER) throw "unreachable";

		console.log("register status", ResponseType[res.status]);
		this.socket.send(JSON.stringify(res));
		return;
	}
}

class P2PSocket {
	decoder: MessageDecoder;
	encoder: MessageEncoder;
	socket: WebSocket;

	static async init(socket: WebSocket) {
		return await new Promise<P2PSocket>((resolve) => {
			socket.addEventListener("open", () => {
				socket.addEventListener("message", async (e) => {
					const { ip }: { ip: string } = JSON.parse(e.data);
					const [hostname, port] = ip.split(":");
					const conn = await Deno.connect({
						hostname,
						port: parseInt(port),
					});
					resolve(new P2PSocket(conn, socket));
				}, { once: true });
			}, { once: true });
		});
	}

	constructor(conn: Deno.Conn, socket: WebSocket) {
		this.socket = socket;
		this.decoder = new MessageDecoder(conn);
		this.encoder = new MessageEncoder(conn);

		socket.addEventListener("message", (e) => {
			this.handle(JSON.parse(e.data));
		});
	}

	handle(message: Message) {
		if (message.type === MessageType.SEND_MESSAGE) {
			this.sendMessage(message);
		}
	}

	sendMessage(message: SendMessageMessage) {
		// TODO
	}
}

await serve(async (request) => {
	if (request.headers.get("upgrade") === "websocket") {
		const { socket, response } = Deno.upgradeWebSocket(request);

		if (request.headers.get("sec-websocket-protocol") === "p2p.chtbx.com") {
			await P2PSocket.init(socket);
		} else {
			await ClientServerSocket.init(socket);
		}

		return response;
	}

	// delegate to esbuild file server
	const url = new URL(request.url);
	url.port = `${esbuildPort}`;
	return await fetch(url, request);
}, { port: parseInt(Deno.env.get("CLIENT_PORT")!) });
