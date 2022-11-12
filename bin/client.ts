import "dotenv/load";
import { serve } from "std/http/server.ts";
import { Request, RequestEncoder, ResponseDecoder } from "../message.ts";
import { port as esbuildPort } from "./esbuild.ts";

const serverConn = await Deno.connect({
	hostname: Deno.env.get("SERVER_HOST")!,
	port: parseInt(Deno.env.get("SERVER_PORT")!),
});
const decoder = new ResponseDecoder(serverConn);
const encoder = new RequestEncoder(serverConn);

let username: string | null = null;

await serve(async (request) => {
	if (request.headers.get("upgrade") === "websocket") {
		const { socket, response } = Deno.upgradeWebSocket(request);
		socket.addEventListener("open", () => {
			socket.send(JSON.stringify({ username }));
		}, { once: true });
		socket.addEventListener("message", (e) => {
			handleRequest(socket, JSON.parse(e.data));
		});
		return response;
	}

	// delegate to esbuild file server
	const url = new URL(request.url);
	url.port = `${esbuildPort}`;
	return await fetch(url, request);
}, { port: 3000 });

async function handleRequest(socket: WebSocket, req: Request) {
	console.log(req.type);
	if (req.type == "login") {
		encoder.login(req.username, req.password);
		const res = await decoder.login();
		console.log("login status", res.status);
		socket.send(JSON.stringify(res));

		if (res.status == "OK") {
			username = req.username;
		}

		return;
	}
	throw new Error("unreachable");
}
