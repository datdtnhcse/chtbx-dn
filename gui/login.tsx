import { useSignal } from "@preact/signals";
import { LoginStatus, RequestType } from "../message.ts";
import Register from "./register.tsx";
import { clientServerSocket } from "./websocket.ts";

export default function Login() {
	const registersignal = useSignal("");
	const inputUsername = useSignal("");
	const inputPassword = useSignal("");
	const status = useSignal("");
	const toregister = () => {
		registersignal.value = "OK";
	};
	const login = async () => {
		const res = await clientServerSocket.request({
			type: RequestType.LOGIN,
			username: inputUsername.value,
			password: inputPassword.value,
		});
		if (res.status == LoginStatus.OK) {
			clientServerSocket.username.value = inputUsername.value;
		}
		status.value = LoginStatus[res.status];
	};

	if (registersignal.value == "OK") {
		return <Register />;
	}
	return (
		<div>
			<label>
				Username:
				<input
					type="text"
					value={inputUsername}
					onInput={(e) => inputUsername.value = e.currentTarget.value}
				/>
			</label>
			<p></p>
			<label>
				Password:
				<input
					type="password"
					value={inputPassword}
					onInput={(e) => inputPassword.value = e.currentTarget.value}
				/>
			</label>
			<p></p>
			<button onClick={login}>Đăng nhập</button>
			<button onClick={toregister}>Đăng ký</button>
			<p>{status}</p>
			<p>{registersignal}</p>
		</div>
	);
}
