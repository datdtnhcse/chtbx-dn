import { WebSocketResultAction } from "../connection/action_result.ts";
import { TCPMessageMessage } from "../connection/message_message.ts";
import { serveTCP, serveWS } from "../connection/serve.ts";
import { ResultType } from "../protocol/action_result.ts";
import { MessageType } from "../protocol/message.ts";
import { clientState, guiState, tcpP2PServer, wsP2PServer } from "./state.ts";

serveTCP(tcpP2PServer, async (conn: Deno.Conn) => {
	const tcpP2PConnection = new TCPMessageMessage(conn, "tcp p2p from ??");
	const helloMsg = await tcpP2PConnection.wait("HELLO");
	setupTCPP2PConnection(tcpP2PConnection, helloMsg.username);
});

// this function is extracted for reuse in client_server.ts
export function setupTCPP2PConnection(
	tcpP2PConnection: TCPMessageMessage,
	username: string,
) {
	const friend = guiState.friends.find((friend) =>
		friend.username === username
	);
	if (!friend) throw "no friend with that id exist";

	tcpP2PConnection.label = `tcp p2p from ${friend.username}`;

	clientState.tcpP2PConnections.set(friend.username, tcpP2PConnection);
	guiState.connecteds.add(friend.username);

	clientState.wsC2SConnection?.send({
		type: ResultType.CONNECT,
		username: friend.username,
	});

	tcpP2PConnection.on("SEND_MESSAGE", (msg) => {
		guiState.dialogs.get(friend.username)!.push({
			type: "content",
			author: friend.username,
			content: msg.content,
		});
		clientState.wsC2SConnection?.send({
			type: ResultType.SYNC,
			state: guiState,
		});
	});

	tcpP2PConnection.on("FILE_OFFER", (msg) => {
		guiState.offeredFile = {
			name: msg.name,
			size: msg.size,
		};
		clientState.wsC2SConnection?.sync(guiState);
	});

	tcpP2PConnection.on("FILE_REVOKE", () => {
		guiState.offeredFile = null;
		clientState.wsC2SConnection?.sync(guiState);
	});

	tcpP2PConnection.onDisconnect(() => {
		console.log(username, "disconnected");
		clientState.tcpP2PConnections.delete(username);
		guiState.connecteds.delete(username);
		guiState.offeredFile = null;
	});
}

serveWS(wsP2PServer, async (socket: WebSocket) => {
	console.log("handle p2p websocket connection");
	const wsP2PConnection = new WebSocketResultAction(socket, "ws p2p");
	const act = await wsP2PConnection.wait("CONNECT");
	const tcpP2PConnection = clientState.tcpP2PConnections.get(act.username);
	console.log("resolved friend connection");

	wsP2PConnection.on("SEND_MESSAGE", async (msg) => {
		guiState.dialogs.get(act.username)!.push({
			type: "content",
			author: guiState.username!,
			content: msg.content,
		});
		await clientState.wsC2SConnection!.send({
			type: ResultType.SYNC,
			state: guiState,
		});
		await tcpP2PConnection!.send({
			type: MessageType.SEND_MESSAGE,
			content: msg.content,
		});
	});

	let controller = new AbortController();
	wsP2PConnection.on("FILE_OFFER", async (msg) => {
		await tcpP2PConnection!.send({
			type: MessageType.FILE_OFFER,
			name: msg.name,
			size: msg.size,
		});
		controller.abort();
		controller = new AbortController();
		tcpP2PConnection!.on("FILE_REQUEST", async () => {
			// requestee must be present not to revoke the file
			await wsP2PConnection.send({
				type: ResultType.FILE_REQUEST,
			});
		}, { signal: controller.signal });
	});

	wsP2PConnection.on("FILE_REQUEST", async () => {
		const file = guiState.offeredFile!;

		await tcpP2PConnection!.send({ type: MessageType.FILE_REQUEST });

		const fsFile = await Deno.open("downloads/" + file.name, {
			write: true,
			truncate: true,
			create: true,
		});
		let total = 0;
		while (true) {
			const msg = await tcpP2PConnection!.wait("FILE_SEND");
			total += msg.chunk.byteLength;
			let bytesWritten = 0;
			while (true) {
				bytesWritten = await fsFile.write(
					msg.chunk.slice(bytesWritten),
				);
				if (bytesWritten == 0) {
					break;
				}
			}
			if (total === file.size) {
				await wsP2PConnection.send({ type: ResultType.FILE_SEND });
				break;
			}
		}
	});

	wsP2PConnection.on("FILE_SEND", async (act) => {
		await tcpP2PConnection!.send({
			type: MessageType.FILE_SEND,
			chunk: act.chunk,
		});
	});

	wsP2PConnection.onDisconnect(async () => {
		controller.abort();
		await tcpP2PConnection?.send({ type: MessageType.FILE_REVOKE });
	});

	tcpP2PConnection!.onDisconnect(() => {
		controller.abort();
		wsP2PConnection.disconnect();
	}, { signal: wsP2PConnection.controller.signal });
});
