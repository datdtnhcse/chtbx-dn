import { useSignal } from "@preact/signals";
import { RegisterStatus, RequestType } from "../message.ts";
import Login from "./login.tsx";
import { request } from "./websocket.ts";

export default function Register() {
	const inputUsername = useSignal("");
	const inputPassword = useSignal("");
	const inputComPassword = useSignal("");
	const loginsignal = useSignal("");
	const status = useSignal("");
	const tologin = () => {
		loginsignal.value = "OK";
	};
	const register = async () => {
		if (inputComPassword.value != inputPassword.value) {
			status.value = "Wrong comfirm password!!";
		} else {
			const res = await request({
				type: RequestType.REGISTER,
				username: inputUsername.value,
				password: inputPassword.value,
			});
			status.value = RegisterStatus[res.status];
			if (res.status == RegisterStatus.OK) {
				status.value = "Đăng ký thành công!!";
			}
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
