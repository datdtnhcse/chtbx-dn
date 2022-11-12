import { signal } from "@preact/signals";
import { send } from "./websocket.ts";

export default function Login() {
	const username = signal("");
	const password = signal("");
	const submit = async () => {
		await send({
			type: "login",
			username: username.value,
			password: password.value,
		});
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
					value={username}
					onInput={(e) => username.value = e.currentTarget.value}
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
		</form>
	);
}
