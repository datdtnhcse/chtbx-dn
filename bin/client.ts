import "dotenv/load";
import { serve } from "std/http/server.ts";
import { Request, RequestEncoder, ResponseDecoder } from "../message.ts";
import { port as esbuildPort } from "./esbuild.ts";

console.log("Connect server",Deno.env.get("SERVER_HOST"),"at",Deno.env.get("SERVER_PORT"));
const serverConn = await Deno.connect({
	hostname: Deno.env.get("SERVER_HOST")!,
	port: parseInt(Deno.env.get("SERVER_PORT")!),
});
const decoder = new ResponseDecoder(serverConn);
const encoder = new RequestEncoder(serverConn);

// state of server connection
let username: string | null = null;

await serve(async (request) => {
	if (request.headers.get("upgrade") === "websocket") {
		const { socket, response } = Deno.upgradeWebSocket(request);

		// on initialization, send the current state
		// to sync with the GUI state
		socket.addEventListener("open", () => {
			socket.send(JSON.stringify({ username }));
		}, { once: true });

		// handle request from GUI
		socket.addEventListener("message", (e) => {
			handleRequest(socket, JSON.parse(e.data));
		});

		return response;
	}

	// delegate to esbuild file server
	const url = new URL(request.url);
	url.port = `${esbuildPort}`;
	return await fetch(url, request);
}, { port: parseInt(Deno.env.get("CLIENT_PORT")!) });

async function handleRequest(socket: WebSocket, req: Request) {
	if (req.type == "login") {
		encoder.login(req.username, req.password);
		const res = await decoder.decode();
		if (res.type !== "login") throw "unreachable";

		console.log("login status", res.status);
		socket.send(JSON.stringify(res));

		if (res.status == "OK") {
			username = req.username;
		}

		return;
	}
	if (req.type == "register") {
		encoder.register(req.username, req.password);
		const res = await decoder.decode();
		if (res.type !== "register") throw "unreachable";

		console.log("login status", res.status);
		socket.send(JSON.stringify(res));
		return;
	}
	throw new Error("unreachable");
}
