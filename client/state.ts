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
import { GUIState } from "../protocol/action_result.ts";

export const wsC2SServer = Deno.listen({ port: WEBSOCKET_PORT });
export const wsP2PServer = Deno.listen({ port: SUBWEBSOCKET_PORT });
export const tcpP2PServer = Deno.listen({ port: P2P_PORT });

if (tcpP2PServer.addr.transport !== "tcp") throw "unreachable";

// state that can be sent to the gui
export const guiState: GUIState = {
	username: null,
	friends: [],
	dialogs: new Map(),
};

type ClientState = {
	ip: string;
	port: number;
	wsC2SConnection: WebSocketResultAction | null;
	tcpP2PConnections: Map<string, TCPMessageMessage>;
	tcpC2SConnection: TCPRequestResponse;
};

// state that can't be sent to the gui, e.g, connections
export const clientState: ClientState = {
	ip: tcpP2PServer.addr.hostname,
	port: tcpP2PServer.addr.port,
	wsC2SConnection: null,
	tcpP2PConnections: new Map(),
	tcpC2SConnection: new TCPRequestResponse(
		await Deno.connect(
			{ hostname: SERVER_HOST, port: SERVER_PORT },
		),
		"tcp c2s",
	),
};
