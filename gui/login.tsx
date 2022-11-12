import { signal } from "@preact/signals";
import { username } from "./state.ts";
import { send } from "./websocket.ts";

export default function Login() {
	const inputUsername = signal("");
	const inputPassword = signal("");

	// login status
	const status = signal("");

	const login = async () => {
		const res = await send({
			type: "login",
			username: inputUsername.value,
			password: inputPassword.value,
		});
		if (res.status == "OK") {
			username.value = inputUsername.value;
		}
		status.value = res.status;
	};

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
			<label>
				Password:
				<input
					type="password"
					value={inputPassword}
					onInput={(e) => inputPassword.value = e.currentTarget.value}
				/>
			</label>
			<button onClick={login}>Đăng nhập</button>
			<p>{status}</p>
		</div>
	);
}
