import { Signal, signal } from "@preact/signals";
import { WebSocketActionResult } from "../connection/action_result.ts";
import { ActionType, GUIState } from "../protocol/action_result.ts";

declare global {
	interface Window {
		WEBSOCKET_PORT: number;
		SUBWEBSOCKET_PORT: number;
	}
}

// client socket

const url = new URL(window.location.toString());
url.protocol = "ws";
url.port = `${window.WEBSOCKET_PORT}`;
export const wsC2SConnection = new WebSocketActionResult(
	new WebSocket(url),
	"ws c2s",
);

// local data

type SignalState = {
	[K in keyof GUIState]: Signal<GUIState[K]>;
};

export const state: SignalState = {
	username: signal(null),
	friends: signal([]),
};

// initial sync
export const initializing = signal(true);
wsC2SConnection.on("SYNC", (res) => {
	initializing.value = false;
	for (const k in res.state) {
		// @ts-ignore: same key, no worries
		state[k].value = res.state[k] === undefined
			// @ts-ignore: same key, no worries
			? state[k].value
			// @ts-ignore: same key, no worries
			: res.state[k];
	}
});

export const wsP2PConnections: Map<string, WebSocketActionResult> = new Map();

wsC2SConnection.on("CONNECT", (res) => {
	url.port = `${window.SUBWEBSOCKET_PORT}`;
	const wsP2PConnection = new WebSocketActionResult(
		new WebSocket(url),
		"ws p2p",
	);
	wsP2PConnections.set(res.username, wsP2PConnection);
	wsP2PConnection.send({ type: ActionType.CONNECT, username: res.username });
	wsP2PConnection.onDisconnect(() => {
		wsP2PConnections.delete(res.username);
	});
});
