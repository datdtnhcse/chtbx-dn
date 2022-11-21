import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";

const CLIENT_NO = parseInt(Deno.env.get("CLIENT_NO") || "") || 0;

const env = config({
	path: `./.env.client${CLIENT_NO}`,
});
for (const key in env) {
	Deno.env.set(key, env[key]);
}

export const SERVER_HOST = Deno.env.get("SERVER_HOST")!;
export const SERVER_PORT = parseInt(Deno.env.get("SERVER_PORT")!);

export const SUBWEBSOCKET_PORT = parseInt(Deno.env.get("SUBWEBSOCKET_PORT")!);

export const WEBSOCKET_PORT = parseInt(Deno.env.get("WEBSOCKET_PORT")!);
export const WEBAPP_PORT = parseInt(Deno.env.get("WEBAPP_PORT")!);
export const P2P_PORT = parseInt(Deno.env.get("P2P_PORT")!);
