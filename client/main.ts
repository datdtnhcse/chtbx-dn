import { WebSocketResultAction } from "../connection/action_result.ts";
import { TCPMessageMessage } from "../connection/message_message.ts";
import { TCPRequestResponse } from "../connection/request_response.ts";
import {
	P2P_PORT,
	SERVER_HOST,
	SERVER_PORT,
	SUBWEBSOCKET_PORT,
	WEBSOCKET_PORT,
} from "../env.ts";
import { ResultType, State } from "../protocol/action_result.ts";
import { MessageType } from "../protocol/message.ts";
import {
	Friend,
	LoginStatus,
	RequestType,
} from "../protocol/request_response.ts";

// The client computer has to open 3 ports:
// 1. Preact web app (see webapp.ts)
// 2. WebSocket server
// 3. P2P server

const webSocketServer = Deno.listen({ port: WEBSOCKET_PORT, transport: "tcp" });
const subWebSocketServer = Deno.listen({
	port: SUBWEBSOCKET_PORT,
	transport: "tcp",
});
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

const state: State = { username: null, friends: [] };

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
serveSubWebSocket();
async function serveSubWebSocket() {
	for await (const connection of subWebSocketServer) {
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

			handleWebSocketP2P(socket);
			await respondWith(response);
		}
	}
}

async function handleWebSocketClientServer(socket: WebSocket) {
	console.log("New connection");
	try {
		webAppConnection = new WebSocketResultAction(socket);

		webAppConnection.send({ type: ResultType.SYNC, state });

		// 1. if receive login:
		webAppConnection.on("LOGIN", (action) => {
			// 2. request server
			serverConnection.send({
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
				webAppConnection?.send({
					type: ResultType.LOGIN,
					status: res.status,
				});
			}, { once: true });
		});

		webAppConnection.on("REGISTER", (action) => {
			serverConnection.send({
				type: RequestType.REGISTER,
				username: action.username,
				password: action.password,
			});
			serverConnection.on("REGISTER", (res) => {
				webAppConnection?.send({
					type: ResultType.REGISTER,
					status: res.status,
				});
			}, { once: true });
		});

		webAppConnection.on("SYNC", (_) => {
			if (state.username !== null) {
				console.log("fetching friends");
				serverConnection.send({ type: RequestType.FRIEND_LIST });
				serverConnection.on("FRIEND_LIST", (res) => {
					state.friends = res.friends;
					console.log(state.friends);
					webAppConnection?.send({ type: ResultType.SYNC, state });
				}, { once: true });
			} else {
				webAppConnection?.send({ type: ResultType.SYNC, state });
			}
		});

		webAppConnection.on("CONNECT", async (act) => {
			const friend = state.friends.find((friend) =>
				friend.username === act.username
			);
			if (!friend) throw "no friend with that username exist";
			const theirEnd = new TCPMessageMessage(
				await Deno.connect({
					hostname: friend.ip == "0.0.0.0" ? "127.0.0.1" : friend.ip,
					port: friend.port,
				}),
			);
			friendConnections.set(act.username, [null, theirEnd]);
			theirEnd.send({
				type: MessageType.HELLO,
				username: state.username!,
			});
			theirEnd.listen().finally(() => {
				friendConnections.delete(act.username);
			});
		});

		await webAppConnection.listen();
	} finally {
		// on closing:
		webAppConnection = null;
	}
}

async function handleWebSocketP2P(socket: WebSocket) {
	console.log("handle p2p websocket connection");
	const webAppChatConnection = new WebSocketResultAction(socket);
	webAppChatConnection.listen();
	const [ourEnd, theirEnd] = await new Promise<
		[TCPMessageMessage, TCPMessageMessage]
	>((resolve) => {
		webAppChatConnection.on("CONNECT", (act) => {
			const [ourEnd, theirEnd] = friendConnections.get(act.username)!;
			resolve([ourEnd!, theirEnd!]);
		}, { once: true });
	});
	ourEnd.listen();
	theirEnd.listen();
	console.log("resolved friend connection");
	ourEnd.on("SEND_MESSAGE", (msg) => {
		console.log(msg);
	});
	theirEnd.send({
		type: MessageType.SEND_MESSAGE,
		content: "Hello",
	});
}

const friendConnections: Map<
	string,
	[TCPMessageMessage | null, TCPMessageMessage]
> = new Map();

serveP2P();
async function serveP2P() {
	for await (const conn of p2pServer) {
		if (webAppConnection === null) {
			conn.close();
			continue;
		}
		const ourEnd = new TCPMessageMessage(conn);
		ourEnd.listen();
		const friend = await new Promise<Friend | undefined>((resolve) =>
			ourEnd.on("HELLO", (msg) => {
				resolve(
					state.friends.find((friend) =>
						friend.username === msg.username
					),
				);
			}, { once: true })
		);
		if (!friend) throw "no friend with that id exist";
		const ends = friendConnections.get(friend.username);
		if (ends && ends[1]) {
			ends[0] = ourEnd;
		} else {
			const theirEnd = new TCPMessageMessage(
				await Deno.connect({ hostname: friend.ip, port: friend.port }),
			);
			theirEnd.listen().finally(() => {
				friendConnections.delete(friend.username);
			});
			friendConnections.set(friend.username, [ourEnd, theirEnd]);
		}
		webAppConnection.send({
			type: ResultType.CONNECT,
			username: friend.username,
		});
	}
}
