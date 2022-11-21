import { useSignal } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { RegisterStatus } from "../protocol/request_response.ts";
import Login from "./login.tsx";
import { clientConnection } from "./state.ts";

export default function Register() {
	const inputUsername = useSignal("");
	const inputPassword = useSignal("");
	const inputComPassword = useSignal("");
	const loginsignal = useSignal("");
	const status = useSignal("");
	const tologin = () => {
		loginsignal.value = "OK";
	};
	const register = () => {
		if (inputComPassword.value != inputPassword.value) {
			status.value = "Wrong comfirm password!!";
		} else {
			clientConnection.on("REGISTER", (res) => {
				if (res.status == RegisterStatus.OK) {
					status.value = "Đăng ký thành công!!";
				}
				status.value = RegisterStatus[res.status];
			}, { once: true });
			clientConnection.act({
				type: ActionType.REGISTER,
				username: inputUsername.value,
				password: inputPassword.value,
			});
		}
	};

	if (loginsignal.value == "OK") {
		return <Login />;
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
			<label>
				Comfirm password:
				<input
					type="password"
					value={inputComPassword}
					onInput={(e) =>
						inputComPassword.value = e.currentTarget.value}
				/>
			</label>
			<p></p>
			<button onClick={register}>Đăng ký</button>
			<button onClick={tologin}>Trở về đăng nhập</button>
			<p>{status}</p>
			<p>{loginsignal}</p>
		</div>
	);
}
