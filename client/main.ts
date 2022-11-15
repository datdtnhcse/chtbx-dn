import { TCPRequestResponse } from "../connection/request_response.ts";
import { WebSocketResultAction } from "../connection/result_action.ts";
import { P2P_PORT, SERVER_HOST, SERVER_PORT, WEBSOCKET_PORT } from "../env.ts";
import { ResultType, State } from "../protocol/action_result.ts";
import { LoginStatus, RequestType } from "../protocol/request_response.ts";

// The client computer has to open 3 ports:
// 1. Preact web app (see webapp.ts)
// 2. WebSocket server
// 3. P2P server

const webSocketServer = Deno.listen({ port: WEBSOCKET_PORT, transport: "tcp" });
const p2pServer = Deno.listen({ port: P2P_PORT, transport: "tcp" });

// Also, it has to connect to server

const serverConnection = new TCPRequestResponse(
	await Deno.connect({
		hostname: SERVER_HOST,
		port: SERVER_PORT,
	}),
);
serverConnection.listen();

// PROCESS STATES

let webAppConnection: WebSocketResultAction | null = null;

if (p2pServer.addr.transport !== "tcp") throw "unreachable";
const ip = p2pServer.addr.hostname;
const port = p2pServer.addr.port;

const state: State = { username: null };
// list of friends

// WEB SOCKET SERVER
serveWebSocket();
async function serveWebSocket() {
	for await (const connection of webSocketServer) {
		const httpConnection = Deno.serveHttp(connection);
		for await (const { request, respondWith } of httpConnection) {
			if (request.headers.get("upgrade") !== "websocket") {
				// not supported, only websocket are allowed
				await respondWith(
					new Response("only websocket connection are allowed", {
						status: 505,
					}),
				);
				continue;
			}

			const { socket, response } = Deno.upgradeWebSocket(request);

			// if client want to open a p2p connection
			const subProtocol = request.headers.get("sec-websocket-protocol");
			if (subProtocol === "p2p.chtbx.com") {
				// TODO
				await respondWith(response);
				continue;
			}

			// client open a client-server connection
			if (webAppConnection != null) {
				const response = new Response(
					"only one main websocket connection are allowed",
					{ status: 409 },
				);
				await respondWith(response);
				continue;
			}

			handleWebSocketClientServer(socket);
			await respondWith(response);
		}
	}
}

async function handleWebSocketClientServer(socket: WebSocket) {
	console.log("New connection");
	try {
		webAppConnection = new WebSocketResultAction(socket);

		webAppConnection.result({ type: ResultType.SYNC, state });

		// 1. if receive login:
		webAppConnection.on("LOGIN", (action) => {
			// 2. request server
			serverConnection.request({
				type: RequestType.LOGIN,
				username: action.username,
				password: action.password,
				ip,
				port,
			});
			// 3. if receive response:
			serverConnection.on("LOGIN", (res) => {
				// 4. result
				if (res.status === LoginStatus.OK) {
					state.username = action.username;
				}
				webAppConnection?.result({
					type: ResultType.LOGIN,
					status: res.status,
				});
			}, { once: true });
		});

		webAppConnection.on("REGISTER", (action) => {
			serverConnection.request({
				type: RequestType.REGISTER,
				username: action.username,
				password: action.password,
			});
			serverConnection.on("REGISTER", (res) => {
				webAppConnection?.result({
					type: ResultType.REGISTER,
					status: res.status,
				});
			}, { once: true });
		});

		await webAppConnection.listen();
	} finally {
		// on closing:
		webAppConnection = null;
	}
}
