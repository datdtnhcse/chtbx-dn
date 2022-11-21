import { Signal, signal } from "@preact/signals";
import { WebSocketActionResult } from "../connection/action_result.ts";
import { ActionType, State } from "../protocol/action_result.ts";

// client socket

declare global {
	interface Window {
		WEBSOCKET_PORT: number;
		SUBWEBSOCKET_PORT: number;
	}
}

const url = new URL(window.location.toString());
url.protocol = "ws";
url.port = `${window.WEBSOCKET_PORT}`;
const mainSocket = new WebSocket(url);
export const clientConnection = new WebSocketActionResult(mainSocket);
clientConnection.listen();

// local data

type SignalState = {
	[K in keyof State]: Signal<State[K]>;
};

export const state: SignalState = {
	username: signal(null),
	friends: signal([]),
};

// initial sync
export const initializing = signal(true);
clientConnection.on("SYNC", (res) => {
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

const friendConnections: Map<string, WebSocketActionResult> = new Map();

clientConnection.on("CONNECT", (res) => {
	url.port = `${window.SUBWEBSOCKET_PORT}`;
	const socket = new WebSocket(url);
	const friendConnection = new WebSocketActionResult(socket);
	friendConnections.set(res.username, friendConnection);
	friendConnection.act({ type: ActionType.CONNECT, username: res.username });
	friendConnection.listen().finally(() => {
		friendConnections.delete(res.username);
	});
});
