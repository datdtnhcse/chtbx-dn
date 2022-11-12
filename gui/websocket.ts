import {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
} from "../message.ts";
import { initializing, username } from "./state.ts";

const url = new URL(window.location.toString());
url.protocol = "ws";
url.pathname = "";
const socket = new WebSocket(url);

socket.addEventListener("open", (e) => {
	console.log(e);
});
socket.addEventListener("error", (e) => {
	console.error(e);
});
socket.addEventListener("close", (e) => {
	console.log(e);
});

socket.addEventListener("message", (e) => {
	console.log("Initiate", e.data);
	const data = JSON.parse(e.data);
	initializing.value = false;
	username.value = data;
}, { once: true });

export function send(req: LoginRequest): Promise<LoginResponse>;
export function send(req: RegisterRequest): Promise<RegisterResponse>;
export async function send(req: unknown) {
	return await new Promise((resolve) => {
		socket.send(JSON.stringify(req));
		socket.addEventListener("message", (e) => {
			resolve(JSON.parse(e.data));
		}, { once: true });
	});
}
