import { TCPResponseRequest } from "../connection/response_request.ts";
import { SERVER_PORT } from "../env.ts";
import {
	LoginStatus,
	RegisterStatus,
	ResponseType,
} from "../protocol/request_response.ts";
import { addAccount, findAccount, setIP } from "../server/db.ts";

const listener = Deno.listen({
	port: SERVER_PORT,
	transport: "tcp",
});

console.log("server listen at", SERVER_PORT);

for await (const conn of listener) {
	console.log("Client connect", conn.remoteAddr);

	// connection state here
	let id: number | null;

	const listener = new TCPResponseRequest(conn);

	listener.on("LOGIN", (request) => {
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
			listener.respond({
				type: ResponseType.LOGIN,
				status: LoginStatus.USERNAME_NOT_EXIST,
			});
			return;
		}
		if (account.password != request.password) {
			console.log("password mismatch", account.password);
			listener.respond({
				type: ResponseType.LOGIN,
				status: LoginStatus.WRONG_PASSWORD,
			});
			return;
		}
		if (account.ip !== null) {
			console.log("already logged in");
			listener.respond({
				type: ResponseType.LOGIN,
				status: LoginStatus.ALREADY_LOGGED_IN,
			});
			return;
		}
		console.log(
			"logged in",
			account.id,
			request.username,
			request.ip,
			request.port,
		);
		id = account.id;
		setIP.first({ id, ip: request.ip, port: request.port });
		listener.respond({
			type: ResponseType.LOGIN,
			status: LoginStatus.OK,
		});
	});

	listener.on("REGISTER", (request) => {
		console.log(
			"Someone register:",
			request.username,
			"with password:",
			request.password,
		);
		const account = findAccount.firstEntry({
			username: request.username,
		});
		if (account) {
			console.log("username is exist");
			listener.respond({
				type: ResponseType.REGISTER,
				status: RegisterStatus.USERNAME_IS_EXIST,
			});
			return;
		}
		addAccount.firstEntry({
			username: request.username,
			password: request.password,
		});
		listener.respond({
			type: ResponseType.REGISTER,
			status: RegisterStatus.OK,
		});
	});

	listener.listen().finally(() => {
		console.log("terminated");
		if (id != null) {
			setIP.firstEntry({ id, ip: null, port: null });
		}
	});
}
