export async function serveTCP(
	server: Deno.Listener,
	handler: (conn: Deno.Conn) => unknown,
): Promise<void> {
	console.log("TCP at", server.addr);
	for await (const connection of server) {
		handler(connection);
	}
}

export function serveHTTPServer(
	server: Deno.Listener,
	handler: (req: Request) => Response | Promise<Response>,
) {
	console.log("HTTP at", server.addr);
	serveTCP(server, async (conn) => {
		for await (const { request, respondWith } of Deno.serveHttp(conn)) {
			await respondWith(handler(request));
		}
	});
}

export function serveWS(
	server: Deno.Listener,
	handler: (ws: WebSocket) => unknown,
) {
	console.log("WebSocket at", server.addr);
	serveHTTPServer(server, (req) => {
		if (req.headers.get("upgrade") !== "websocket") {
			// not supported, only websocket are allowed
			const response = new Response(
				"only websocket connection are allowed",
				{ status: 505 },
			);
			return Promise.resolve(response);
		}
		const { socket, response } = Deno.upgradeWebSocket(req);
		handler(socket);
		return response;
	});
}
