import { batch, effect, Signal, signal } from "@preact/signals";
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
	dialogs: signal(new Map()),
	connecteds: signal(new Set()),
	offeredFile: signal(null),
};

// initial sync
export const initializing = signal(true);
wsC2SConnection.on("SYNC", (res) => {
	batch(() => {
		for (const k in res.state) {
			// @ts-ignore: same key, no worries
			state[k].value = res.state[k] === undefined
				// @ts-ignore: same key, no worries
				? state[k].value
				// @ts-ignore: same key, no worries
				: res.state[k];
		}
		if (initializing.value) {
			for (const username of state.connecteds.value) {
				wsC2SConnection.send({
					type: ActionType.CONNECT,
					username: username,
				});
			}
			setInterval(() => {
				wsC2SConnection.send({ type: ActionType.SYNC });
			}, 5000);
		}
		initializing.value = false;
	});
});

export const wsP2PConnections: Map<string, WebSocketActionResult> = new Map();

wsC2SConnection.on("CONNECT", (res) => {
	if (state.connecteds.value.has(res.username)) return;
	state.connecteds.value.add(res.username);
	state.connecteds.value = new Set(state.connecteds.value);
});

let prevConnecteds = new Set<string>();
effect(() => {
	for (const username of prevConnecteds) {
		if (!state.connecteds.value.has(username)) {
			wsP2PConnections.delete(username);
		}
	}
	for (const username of state.connecteds.value) {
		if (!prevConnecteds.has(username)) {
			url.port = `${window.SUBWEBSOCKET_PORT}`;
			const wsP2PConnection = new WebSocketActionResult(
				new WebSocket(url),
				"ws p2p",
			);
			wsP2PConnections.set(username, wsP2PConnection);
			wsP2PConnection.send({
				type: ActionType.CONNECT,
				username,
			});
			wsP2PConnection.onDisconnect(() => {
				wsC2SConnection.send({ type: ActionType.SYNC });
			});
		}
	}
	prevConnecteds = new Set(state.connecteds.value);
});
