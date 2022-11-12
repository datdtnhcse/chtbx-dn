import { signal } from "@preact/signals";
import { username } from "./state.ts";
import { send } from "./websocket.ts";

export default function Login() {
	const inputUsername = signal("");
	const password = signal("");
	const status = signal("");
	const submit = async () => {
		const res = await send({
			type: "login",
			username: inputUsername.value,
			password: password.value,
		});
		if (res.status == "OK") {
			username.value = inputUsername.value;
		}
		status.value = res.status;
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
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
					value={password}
					onInput={(e) => password.value = e.currentTarget.value}
				/>
			</label>
			<button>Ok</button>
			<p>{status}</p>
		</form>
	);
}
