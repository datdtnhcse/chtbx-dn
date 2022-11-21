import "dotenv/load";

export const SERVER_HOST = Deno.env.get("SERVER_HOST")!;
export const SERVER_PORT = parseInt(Deno.env.get("SERVER_PORT")!);

export const SUBWEBSOCKET_PORT = parseInt(Deno.env.get("SUBWEBSOCKET_PORT")!);

export const WEBSOCKET_PORT = parseInt(Deno.env.get("WEBSOCKET_PORT")!);
export const WEBAPP_PORT = parseInt(Deno.env.get("WEBAPP_PORT")!);
export const P2P_PORT = parseInt(Deno.env.get("P2P_PORT")!);
