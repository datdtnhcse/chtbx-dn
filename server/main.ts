import { TCPResponseRequest } from "../connection/request_response.ts";
import { serveTCP } from "../connection/serve.ts";
import { SERVER_PORT } from "../env.ts";
import {
	AddFriendStatus,
	LoginStatus,
	RegisterStatus,
	ResponseType,
} from "../protocol/request_response.ts";
import {
	addAccount,
	findAccountById,
	findAccountByUsername,
	findRequestExisted,
	getFriendlist,
	sendBackRequest,
	sendFriendRequest,
	setIP,
} from "../server/db.ts";

const tcpC2SConnection = Deno.listen({
	port: SERVER_PORT,
	transport: "tcp",
});

serveTCP(tcpC2SConnection, (conn) => {
	// connection state here
	let id: number | null = null;

	const clientConnection = new TCPResponseRequest(conn, "tcp");

	clientConnection.on("LOGIN", (request) => {
		console.log(
			"user",
			request.username,
			"log in with",
			request.password,
		);
		const account = findAccountByUsername.firstEntry({
			username: request.username,
		});
		if (!account) {
			console.log("username does not exist");
			clientConnection.send({
				type: ResponseType.LOGIN,
				status: LoginStatus.USERNAME_NOT_EXIST,
			});
			return;
		}
		if (account.password != request.password) {
			console.log("password mismatch", account.password);
			clientConnection.send({
				type: ResponseType.LOGIN,
				status: LoginStatus.WRONG_PASSWORD,
			});
			return;
		}
		if (account.ip !== null) {
			console.log("already logged in");
			clientConnection.send({
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
		clientConnection.send({
			type: ResponseType.LOGIN,
			status: LoginStatus.OK,
		});
	});

	clientConnection.on("REGISTER", (request) => {
		console.log(
			"Someone register:",
			request.username,
			"with password:",
			request.password,
		);
		const account = findAccountByUsername.firstEntry({
			username: request.username,
		});
		if (account) {
			console.log("username is exist");
			clientConnection.send({
				type: ResponseType.REGISTER,
				status: RegisterStatus.USERNAME_IS_EXIST,
			});
			return;
		}
		addAccount.firstEntry({
			username: request.username,
			password: request.password,
		});
		clientConnection.send({
			type: ResponseType.REGISTER,
			status: RegisterStatus.OK,
		});
	});

	clientConnection.on("ADD_FRIEND", (request) => {
		if (id === null) return;
		console.log(
			"Make friend with:",
			request.username,
		);
		const account = findAccountByUsername.firstEntry({
			username: request.username,
		});
		if (!account) {
			console.log("username is not exist");
			clientConnection.send({
				type: ResponseType.ADD_FRIEND,
				status: AddFriendStatus.USERNAME_NOT_EXIST,
			});
			return;
		}
		if (account.id == id) {
			console.log("this is your username bro?!");
			clientConnection.send({
				type: ResponseType.ADD_FRIEND,
				status: AddFriendStatus.YOUR_USERNAME,
			});
			return;
		}
		const friendRequest = findRequestExisted.firstEntry({
			id,
			friendId: account.id,
		});
		if (friendRequest == null) {
			sendFriendRequest.firstEntry({
				id,
				friendId: account.id,
			});
			console.log("send friend request successfully");
			clientConnection.send({
				type: ResponseType.ADD_FRIEND,
				status: AddFriendStatus.OK,
			});
			return;
		}
		if (friendRequest.state == "sent") {
			console.log("already sent friend request");
			clientConnection.send({
				type: ResponseType.ADD_FRIEND,
				status: AddFriendStatus.ALREADY_SENT,
			});
			return;
		}
		if (friendRequest.state == "received") {
			sendBackRequest.execute({
				id,
				friendId: account.id,
			});
			console.log("now, you are friends");
			clientConnection.send({
				type: ResponseType.ADD_FRIEND,
				status: AddFriendStatus.OK,
			});
			return;
		}
		if (friendRequest.state == "friended") {
			console.log("you were friends, chat now!");
			clientConnection.send({
				type: ResponseType.ADD_FRIEND,
				status: AddFriendStatus.YOU_WERE_FRIENDS,
			});
			return;
		}
	});

	clientConnection.on("FRIEND_LIST", () => {
		if (id === null) return;
		console.log("finding friends of", id);
		const account = findAccountById.firstEntry({ id });
		console.log(account);
		if (!account) throw "account not found in database: " + id;

		const friends = getFriendlist(id);

		clientConnection.send({
			type: ResponseType.FRIEND_LIST,
			friends,
		});
	});

	clientConnection.onDisconnect(() => {
		console.log("terminated");
		if (id != null) {
			setIP.firstEntry({ id, ip: null, port: null });
		}
	});
});
