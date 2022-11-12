import { LoginStatus, RequestDecoder, ResponseEncoder } from "../message.ts";
import "./dotenv.ts";

const listener = Deno.listen({
	port: parseInt(Deno.env.get("SERVER_PORT")!),
	transport: "tcp",
});

for await (const conn of listener) {
	handleConn(conn);
}

async function handleConn(conn: Deno.Conn) {
	const decoder = new RequestDecoder(conn);
	const encoder = new ResponseEncoder(conn);
	try {
		while (true) {
			const request = await decoder.decode();
			if (request.type == "login") {
				console.log(request.username, request.password);
				encoder.login(LoginStatus.OK);
			}
		}
	} catch (e) {
		console.error(e.message);
		return;
	}
}
