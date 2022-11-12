import { serveDir } from "std/http/file_server.ts";
import { serve } from "std/http/server.ts";
import { Request, RequestEncoder, ResponseDecoder } from "../message.ts";

const serverConn = await Deno.connect({ port: 1234 });
const decoder = new ResponseDecoder(serverConn);
const encoder = new RequestEncoder(serverConn);

await serve(async (request) => {
	if (request.headers.get("upgrade") === "websocket") {
		const { socket, response } = Deno.upgradeWebSocket(request);
		socket.addEventListener("message", (e) => {
			handleRequest(socket, JSON.parse(e.data));
		});
		return response;
	}
	return await serveDir(request, {
		fsRoot: "./static",
	});
});

async function handleRequest(socket: WebSocket, req: Request) {
	console.log(req.type);
	if (req.type == "login") {
		encoder.login(req.username, req.password);
		const res = await decoder.login();
		socket.send(JSON.stringify(res));
		return;
	}
	throw new Error("unreachable");
}
