import { useSignal } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { LoginStatus } from "../protocol/request_response.ts";
import Register from "./register.tsx";
import { clientConnection, state } from "./state.ts";

export default function Login() {
	const registersignal = useSignal("");
	const inputUsername = useSignal("");
	const inputPassword = useSignal("");
	const status = useSignal("");
	const toregister = () => {
		registersignal.value = "OK";
	};
	const login = () => {
		clientConnection.on("LOGIN", (res) => {
			if (res.status == LoginStatus.OK) {
				state.username.value = inputUsername.value;
			}
			status.value = LoginStatus[res.status];
		}, { once: true });
		clientConnection.act({
			type: ActionType.LOGIN,
			username: inputUsername.value,
			password: inputPassword.value,
		});
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
