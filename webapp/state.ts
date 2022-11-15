import { Signal, signal } from "@preact/signals";
import { WebSocketActionResult } from "../connection/action_result.ts";
import { State } from "../protocol/action_result.ts";

// client socket

declare global {
	interface Window {
		WEBSOCKET_PORT: number;
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

export const state: SignalState = { username: signal(null) };

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
}, { once: true });

// listen for events
