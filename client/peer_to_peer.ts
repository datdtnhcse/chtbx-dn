import { WebSocketResultAction } from "../connection/action_result.ts";
import { TCPMessageMessage } from "../connection/message_message.ts";
import { serveTCP, serveWS } from "../connection/serve.ts";
import { ResultType } from "../protocol/action_result.ts";
import { MessageType } from "../protocol/message.ts";
import { clientState, guiState, tcpP2PServer, wsP2PServer } from "./state.ts";

serveTCP(tcpP2PServer, async (conn: Deno.Conn) => {
	const connection = new TCPMessageMessage(conn, "tcp p2p from ??");
	const helloMsg = await connection.wait("HELLO");
	const friend = guiState.friends.find((friend) =>
		friend.username === helloMsg.username
	);
	if (!friend) throw "no friend with that id exist";
	connection.label = `tcp p2p from ${friend.username}`;

	clientState.tcpP2PConnections.set(friend.username, connection);
	guiState.connecteds.add(friend.username);

	clientState.wsC2SConnection!.send({
		type: ResultType.CONNECT,
		username: friend.username,
	});
});

serveWS(wsP2PServer, async (socket: WebSocket) => {
	console.log("handle p2p websocket connection");
	const wsP2PConnection = new WebSocketResultAction(socket, "ws p2p");
	const act = await wsP2PConnection.wait("CONNECT");
	const tcpP2PConnection = clientState.tcpP2PConnections.get(act.username)!;
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
		tcpP2PConnection.send({
			type: MessageType.SEND_MESSAGE,
			content: msg.content,
		});
	});

	tcpP2PConnection.on("SEND_MESSAGE", (msg) => {
		guiState.dialogs.get(act.username)!.push({
			type: "content",
			author: act.username,
			content: msg.content,
		});
		clientState.wsC2SConnection!.send({
			type: ResultType.SYNC,
			state: guiState,
		});
	}, { signal: wsP2PConnection.controller.signal });

	tcpP2PConnection.onDisconnect(() => {
		console.log(act.username, "disconnected");
		clientState.tcpP2PConnections.delete(act.username);
		guiState.connecteds.delete(act.username);
		wsP2PConnection.disconnect();
	}, { signal: wsP2PConnection.controller.signal });
});
