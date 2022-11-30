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

	wsP2PConnection.on("SEND_MESSAGE", (msg) => {
		guiState.dialogs.get(act.username)!.push({
			type: "content",
			author: guiState.username!,
			content: msg.content,
		});
		clientState.wsC2SConnection!.send({
			type: ResultType.SYNC,
			state: guiState,
		});
		tcpP2PConnection!.send({
			type: MessageType.SEND_MESSAGE,
			content: msg.content,
		});
	});

	wsP2PConnection.on("FILE_OFFER", (msg) => {
		tcpP2PConnection!.send({
			type: MessageType.FILE_OFFER,
			name: msg.name,
			size: msg.size,
		});
	});

	wsP2PConnection.onDisconnect(() => {
		tcpP2PConnection?.send({ type: MessageType.FILE_REVOKE });
	});

	tcpP2PConnection!.onDisconnect(() => {
		wsP2PConnection.disconnect();
	}, { signal: wsP2PConnection.controller.signal });
});
