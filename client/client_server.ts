import { WebSocketResultAction } from "../connection/action_result.ts";
import { TCPMessageMessage } from "../connection/message_message.ts";
import { serveWS } from "../connection/serve.ts";
import { ResultType } from "../protocol/action_result.ts";
import { MessageType } from "../protocol/message.ts";
import {
	FriendStatus,
	LoginStatus,
	RequestType,
} from "../protocol/request_response.ts";
import { clientState, guiState, wsC2SServer } from "./state.ts";

serveWS(wsC2SServer, (socket) => {
	if (clientState.wsC2SConnection != null) {
		socket.close(undefined, "only one connection at each time");
		return;
	}

	console.log("New connection");

	clientState.wsC2SConnection = new WebSocketResultAction(socket, "ws c2s");

	clientState.wsC2SConnection.send({
		type: ResultType.SYNC,
		state: guiState,
	});

	// 1. if receive login:
	clientState.wsC2SConnection.on("LOGIN", async (action) => {
		// 2. request server
		clientState.tcpC2SConnection.send({
			type: RequestType.LOGIN,
			username: action.username,
			password: action.password,
			ip: clientState.ip,
			port: clientState.port,
		});

		// 3. if receive response:
		const res = await clientState.tcpC2SConnection.wait("LOGIN");

		// 4. result
		if (res.status === LoginStatus.OK) {
			guiState.username = action.username;
		}
		clientState.wsC2SConnection!.send({
			type: ResultType.LOGIN,
			status: res.status,
		});
	});

	clientState.wsC2SConnection.on("REGISTER", async (action) => {
		clientState.tcpC2SConnection.send({
			type: RequestType.REGISTER,
			username: action.username,
			password: action.password,
		});
		const res = await clientState.tcpC2SConnection.wait("REGISTER");
		clientState.wsC2SConnection!.send({
			type: ResultType.REGISTER,
			status: res.status,
		});
	});

	clientState.wsC2SConnection.on("ADD_FRIEND", async (action) => {
		clientState.tcpC2SConnection.send({
			type: RequestType.ADD_FRIEND,
			username: action.username,
		});
		const res = await clientState.tcpC2SConnection.wait("ADD_FRIEND");
		clientState.wsC2SConnection!.send({
			type: ResultType.ADD_FRIEND,
			status: res.status,
		});
	});

	clientState.wsC2SConnection.on("SYNC", async () => {
		if (guiState.username !== null) {
			console.log("fetching friends");
			clientState.tcpC2SConnection.send({
				type: RequestType.FRIEND_LIST,
			});
			const res = await clientState.tcpC2SConnection.wait("FRIEND_LIST");
			guiState.friends = res.friends;
			for (const friend of guiState.friends) {
				if (!guiState.dialogs.get(friend.username)) {
					guiState.dialogs.set(friend.username, []);
				}
			}

			console.log(guiState);
		}
		clientState.wsC2SConnection!.send({
			type: ResultType.SYNC,
			state: guiState,
		});
	});

	clientState.wsC2SConnection.on("CONNECT", async (act) => {
		const friend = guiState.friends.find((friend) =>
			friend.username === act.username
		);
		if (!friend) throw "no friend with that username exist";

		if (friend.status.type != FriendStatus.ONLINE) {
			throw "Your friend is not online";
		}
		const tcpP2PConnection = new TCPMessageMessage(
			await Deno.connect({
				hostname: friend.status.ip == "0.0.0.0"
					? "127.0.0.1"
					: friend.status.ip,
				port: friend.status.port,
			}),
			"tcp p2p to " + friend.username,
		);
		clientState.tcpP2PConnections.set(act.username, tcpP2PConnection);
		tcpP2PConnection.send({
			type: MessageType.HELLO,
			username: guiState.username!,
		});
		clientState.wsC2SConnection!.send({
			type: ResultType.CONNECT,
			username: friend.username,
		});
		tcpP2PConnection.onDisconnect(() => {
			clientState.tcpP2PConnections.delete(act.username);
		});
	});

	clientState.wsC2SConnection.onDisconnect(() => {
		clientState.wsC2SConnection = null;
	});
});
