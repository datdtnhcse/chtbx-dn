import "dotenv/load";
import { findAccount, setIP } from "../db.ts";
import { LoginStatus, RequestDecoder, ResponseEncoder } from "../message.ts";

const listener = Deno.listen({
	port: parseInt(Deno.env.get("SERVER_PORT")!),
	transport: "tcp",
});

for await (const conn of listener) {
	handleConn(conn);
}

// handle each TCP connection
async function handleConn(conn: Deno.Conn) {
	if (conn.remoteAddr.transport != "tcp") throw "unreachable";
	const ip = `${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`;
	let id: null | number = null;
	const decoder = new RequestDecoder(conn);
	const encoder = new ResponseEncoder(conn);
	try {
		while (true) {
			const request = await decoder.decode();
			switch (request.type) {
				case "login": {
					console.log(
						"user",
						request.username,
						"log in with",
						request.password,
					);
					const account = findAccount.firstEntry({
						username: request.username,
					});
					if (!account) {
						console.log("username does not exist");
						encoder.login(LoginStatus.USERNAME_NOT_EXIST);
						continue;
					}
					if (account.password != request.password) {
						console.log("password mismatch", account.password);
						encoder.login(LoginStatus.WRONG_PASSWORD);
						continue;
					}
					if (account.ip !== null) {
						console.log("already logged in");
						encoder.login(LoginStatus.ALREADY_LOGGED_IN);
						continue;
					}
					id = account.id;
					setIP.first({ id, ip });
					encoder.login(LoginStatus.OK);
					break;
				}
			}
		}
	} catch (e) {
		console.error(e.message);
		if (id !== null) {
			setIP.first({ id, ip: null });
		}
		return;
	}
}
