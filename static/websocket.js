// @ts-check
/// <reference types="./websocket.d.ts" />

"use strict";

const url = new URL(window.location.toString());
url.protocol = "ws";
url.pathname = "";
const socket = new WebSocket(url);

/** @type {(v: void) => void} */
let _resolve;
export const ready = new Promise((resolve) => _resolve = resolve);
socket.addEventListener("open", (e) => {
	console.log(e);
	_resolve();
});
await ready;

socket.addEventListener("error", (e) => {
	console.error(e);
});
socket.addEventListener("close", (e) => {
	console.log(e);
});

/**
 * @param {any} req
 */
export async function send(req) {
	return await new Promise((resolve) => {
		socket.send(JSON.stringify(req));

		/** @param {MessageEvent} e */
		const onMessage = (e) => {
			resolve(JSON.parse(e.data));
			socket.removeEventListener("message", onMessage);
		};
		socket.addEventListener("message", onMessage);
	});
}
