import { WebSocketResultAction } from "../connection/action_result.ts";
import { TCPMessageMessage } from "../connection/message_message.ts";
import { serveTCPServer, serveWSServer } from "../connection/serve.ts";
import { ResultType } from "../protocol/action_result.ts";
import { MessageType } from "../protocol/message.ts";
import { clientState, guiState, tcpP2PServer, wsP2PServer } from "./state.ts";

serveTCPServer(tcpP2PServer, async (conn: Deno.Conn) => {
	const connection = new TCPMessageMessage(conn, "tcp p2p from ??");
	const helloMsg = await connection.wait("HELLO");
	const friend = guiState.friends.find((friend) =>
		friend.username === helloMsg.username
	);
	if (!friend) throw "no friend with that id exist";
	connection.label = `tcp p2p from ${friend.username}`;

	clientState.tcpP2PConnections.set(friend.username, connection);
	clientState.wsC2SConnection!.send({
		type: ResultType.CONNECT,
		username: friend.username,
	});

	// clean up
	connection.onDisconnect(() => {
		clientState.tcpP2PConnections.delete(friend.username);
	});
});

serveWSServer(wsP2PServer, async (socket: WebSocket) => {
	console.log("handle p2p websocket connection");
	const wsP2PConnection = new WebSocketResultAction(socket, "ws p2p");
	const act = await wsP2PConnection.wait("CONNECT");
	const tcpP2PConnection = clientState.tcpP2PConnections.get(act.username)!;
	console.log("resolved friend connection");

	tcpP2PConnection.on("SEND_MESSAGE", (msg) => {
		console.log(msg);
	});

	wsP2PConnection.on("SEND_MESSAGE", (msg) => {
		tcpP2PConnection.send({
			type: MessageType.SEND_MESSAGE,
			content: msg.message,
		});
	});
});
