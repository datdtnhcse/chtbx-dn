import { useSignal } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { RegisterStatus } from "../protocol/request_response.ts";
import Login from "./login.tsx";
import { wsC2SConnection } from "./state.ts";

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
		wsC2SConnection.send({
			type: ActionType.REGISTER,
			username: inputUsername.value,
			password: inputPassword.value,
		});
		if (inputComPassword.value != inputPassword.value) {
			status.value = "Wrong comfirm password!!";
		} else {
			console.log("register0");
			const res = await wsC2SConnection.wait("REGISTER");
			console.log("register1");
			if (res.status == RegisterStatus.OK) {
				status.value = "Đăng ký thành công!!";
			}
			console.log("register2");
			status.value = RegisterStatus[res.status];
			console.log("register3");
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
